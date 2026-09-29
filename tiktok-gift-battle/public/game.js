import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Battle } from './battle.js';
import { startSimulation } from './simulator.js';
import { createArena, COLORS } from './arena.js';
import { Fighter } from './fighter.js';
import { Particles, Transients } from './effects.js';
import { Hud } from './hud.js';
import { Sfx } from './sfx.js';

const params = new URLSearchParams(location.search);
const LOW_QUALITY = params.get('quality') === 'low'; // ?quality=low for slower PCs: no glow or shadows
const MAX_FPS = Number(params.get('fps')) || 0; // ?fps=30 caps the frame rate to save GPU while streaming
const FOV = 40;
const GAP = 2.3; // distance between the fighters
const PUSH = 0.6; // how far the leader pushes the fight toward the other side

// ---------- renderer, camera, post-processing ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(LOW_QUALITY ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = !LOW_QUALITY;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
const cameraHome = new THREE.Vector3();
const lookAt = new THREE.Vector3(0, 1.05, 0);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.82);
if (!LOW_QUALITY) composer.addPass(bloom);
composer.addPass(new OutputPass());

const arena = createArena(scene);
const particles = new Particles(scene);
const transients = new Transients(scene);
const hud = new Hud();
const sfx = new Sfx(params.get('sound') !== '0');

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.resolution.set(w / 2, h / 2);
  camera.aspect = w / h;
  // fit the arena's width on narrow (portrait) screens, its height on wide ones
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const dist = Math.max(2.75 / (tanV * camera.aspect), 9.5);
  cameraHome.set(0, 1.5 + dist * 0.09, dist);
  camera.updateProjectionMatrix();
  particles.material.uniforms.scale.value = (h * renderer.getPixelRatio()) / (2 * tanV);
}
window.addEventListener('resize', resize);
resize();

// ---------- game state ----------
let fighters = null;
let phase = 'fight';
let scores = { red: 0, blue: 0 };
let frozenScores = null; // final score held during the K.O. sequence
let ko = null; // { winner, loser } while the K.O. / break is running
let breakEndsAt = 0;
let uiTime = 0;
let trauma = 0; // camera shake
let slowUntil = 0;
let slowScale = 1;
let lookY = 1.05;

const other = (f) => (f === fighters.red ? fighters.blue : fighters.red);

function slowMotion(scale, seconds) {
  slowScale = scale;
  slowUntil = uiTime + seconds;
}

function toScreen(position) {
  const v = position.clone().project(camera);
  return { x: ((v.x + 1) / 2) * window.innerWidth, y: ((1 - v.y) / 2) * window.innerHeight };
}

// ---------- combat ----------
const SHAKE = { jab: 0.18, heavy: 0.32, smash: 0.62, super: 0.9 };
const SPARKS = { jab: 16, heavy: 34, smash: 70, super: 140 };

function onImpact(attacker, hit, kind) {
  const defender = other(attacker);
  if (defender.state !== 'fighting') return;
  const from = attacker.chest().add(new THREE.Vector3(attacker.dir * 0.6, 0.1, 0));
  if (kind === 'super') {
    transients.projectile(from, defender.chest(), attacker.color, particles, () => landHit(attacker, defender, hit, kind));
  } else {
    landHit(attacker, defender, hit, kind);
  }
}

function landHit(attacker, defender, hit, kind) {
  if (defender.state !== 'fighting') return;
  defender.takeHit(kind);
  const point = defender.chest().add(new THREE.Vector3(defender.dir * 0.35, 0.1, 0.3));
  const direction = new THREE.Vector3(attacker.dir, 0.3, 0.2);
  particles.emit({ position: point, count: SPARKS[kind], color: attacker.color, speed: 5 + SHAKE[kind] * 6, spread: 0.9, direction, size: 0.22, life: 0.5, gravity: 5 });
  particles.emit({ position: point, count: Math.ceil(SPARKS[kind] / 3), color: '#ffffff', speed: 3, spread: 1, size: 0.18, life: 0.3, gravity: 0 });
  transients.burst(point, attacker.color, { jab: 0.35, heavy: 0.55, smash: 0.8, super: 1.2 }[kind]);
  trauma = Math.min(1, trauma + SHAKE[kind]);
  sfx.play(kind);

  const { x, y } = toScreen(point);
  hud.damage(x, y, `${hit.diamonds.toLocaleString('en-US')}💎`, attacker.side, kind === 'smash' || kind === 'super');

  if (kind === 'heavy') slowMotion(0.05, 0.05);
  if (kind === 'smash') {
    slowMotion(0.05, 0.08);
    transients.shockwave(new THREE.Vector3(defender.root.position.x, arena.floorY + 0.05, 0), attacker.color, 3.5);
    particles.emit({ position: new THREE.Vector3(defender.root.position.x, arena.floorY + 0.1, 0), count: 40, color: '#c9b6ff', speed: 3, spread: 1, up: 1.5, size: 0.35, life: 0.8, gravity: 3 });
    hud.callout('SMASH!', { side: attacker.side, size: 0.8, duration: 1.1, sub: `${hit.name} · ${hit.giftName}` });
  }
  if (kind === 'super') {
    slowMotion(0.15, 0.5);
    transients.shockwave(new THREE.Vector3(defender.root.position.x, arena.floorY + 0.05, 0), attacker.color, 6);
    hud.flash(attacker.side === 'red' ? '#ff5577' : '#55bbff', 0.7);
  }
}

function onSuperCharge(attacker, hit) {
  hud.callout('SUPER!', { side: attacker.side, size: 1.1, duration: 1.4, sub: `${hit.name} sent ${hit.giftName}` });
  sfx.play('charge');
  const around = attacker.chest();
  particles.emit({ position: around.add(new THREE.Vector3(0, 0, -0.6)), count: 40, color: attacker.color, speed: 2.5, spread: 1, up: 2, size: 0.22, life: 0.9, gravity: -1 });
}

function onLand(fighter) {
  trauma = Math.min(1, trauma + 0.45);
  sfx.play('land');
  const feet = new THREE.Vector3(fighter.root.position.x, arena.floorY + 0.05, 0);
  transients.shockwave(feet, fighter.color, 2.5);
  particles.emit({ position: feet, count: 50, color: '#d7c8ff', speed: 3.5, spread: 1, up: 1, size: 0.35, life: 0.7, gravity: 4 });
}

// ---------- K.O. sequence ----------
function onKo(result) {
  ko = result;
  frozenScores = { red: result.red, blue: result.blue };
  hud.freeze(true);
  sfx.play('bell');
  for (const f of Object.values(fighters)) {
    f.queue.length = 0;
  }
  if (!result.winner) {
    hud.callout('TIME!', { size: 1.2, duration: 1.3 });
    setTimeout(() => {
      fighters.red.shrug();
      fighters.blue.shrug();
      hud.showResult(result);
    }, 1200);
    return;
  }

  const winner = fighters[result.winner];
  const loser = fighters[result.loser];
  hud.callout('K.O.!', { size: 1.6, duration: 1.8 });
  // the winner's finishing punch
  winner.busy = true;
  winner.timeline.length = 0;
  winner.after(0.35, () => {
    winner.play('Punch', { fade: 0.05, speed: 0.9 });
    winner.lungeTarget = 0.6;
  });
  winner.after(0.35 + 0.38, () => {
    winner.lungeTarget = 0;
    const point = loser.chest();
    particles.emit({ position: point, count: 220, color: winner.color, speed: 9, spread: 1, direction: new THREE.Vector3(winner.dir, 0.4, 0.2), size: 0.3, life: 0.8, gravity: 4 });
    transients.burst(point, winner.color, 1.4);
    transients.shockwave(new THREE.Vector3(loser.root.position.x, arena.floorY + 0.05, 0), winner.color, 7);
    hud.flash('#ffffff', 0.5);
    trauma = 1;
    sfx.play('super');
    sfx.play('whoosh');
    loser.launch();
    slowMotion(0.3, 1.3);
  });
  winner.after(0.35 + 0.38 + 1.4, () => {
    winner.victory();
    sfx.play('cheer');
    hud.showResult(result);
    confetti(winner);
  });
}

function confetti(winner) {
  let bursts = 0;
  const timer = setInterval(() => {
    for (const x of [-2.5, 0, 2.5]) {
      const color = Math.random() < 0.5 ? winner.color : COLORS.gold;
      particles.emit({ position: new THREE.Vector3(x, 6, -1), count: 22, color, speed: 3, spread: 1, up: 1, size: 0.2, life: 2.6, gravity: 1.2, drag: 1.2, colorJitter: 0.3 });
    }
    if (++bursts >= 8) clearInterval(timer);
  }, 300);
}

function startFight(round) {
  hud.freeze(false);
  frozenScores = null;
  hud.hideResult();
  for (const f of Object.values(fighters)) f.resetForFight();
  ko = null;
  hud.callout(`ROUND ${round}`, { size: 0.7, duration: 0.9 });
  setTimeout(() => {
    hud.callout('FIGHT!', { size: 1.3, duration: 1.1 });
    sfx.play('fight');
  }, 700);
}

// ---------- events from the server (or the demo simulation) ----------
function onState(state) {
  hud.setState(state);
  scores = { red: state.red.diamonds, blue: state.blue.diamonds };
  if (state.phase === 'break') breakEndsAt = uiTime + state.remainingMs / 1000;
  if (state.phase !== phase) {
    phase = state.phase;
    if (phase === 'fight') startFight(state.round);
  }
}

function onGift(gift) {
  hud.toast(gift);
  if (gift.fighting && !ko) fighters[gift.side].queueAttack(gift);
}

function onJoin(join) {
  hud.toast({ ...join, joined: true });
  sfx.play('join');
}

function connect() {
  const handlers = { state: onState, gift: onGift, join: onJoin, ko: onKo };
  if (params.has('demo')) {
    // Everything runs in the browser with fake viewers: no server or TikTok needed
    const battle = new Battle({
      roundSeconds: Number(params.get('round')) || 45,
      breakSeconds: Number(params.get('break')) || 15,
      now: () => performance.now(),
      emit: (event, data) => handlers[event]?.(data),
    });
    setInterval(() => battle.tick(), 100);
    onState(battle.snapshot());
    startFight(1);
    startSimulation(battle, { seed: Number(params.get('seed')) || 7 });
  } else {
    const socket = window.io();
    for (const [event, handler] of Object.entries(handlers)) socket.on(event, handler);
    socket.once('state', (state) => state.phase === 'fight' && startFight(state.round));
  }
}

// ---------- main loop ----------
const timer = new THREE.Timer();
let lastFrame = 0;
function frame() {
  requestAnimationFrame(frame);
  const now = performance.now();
  if (MAX_FPS && now - lastFrame < 1000 / MAX_FPS - 2) return;
  lastFrame = now;
  timer.update();
  const realDt = Math.min(timer.getDelta(), 0.05);
  uiTime += realDt;
  const dt = realDt * (uiTime < slowUntil ? slowScale : 1);

  if (fighters) {
    // the fight drifts toward whoever is losing
    const s = frozenScores ?? scores;
    const total = s.red + s.blue;
    const share = total ? s.red / total : 0.5;
    const center = (share - 0.5) * 2 * PUSH;
    fighters.red.homeX = center - GAP / 2;
    fighters.blue.homeX = center + GAP / 2;

    // near the end of the break: the loser drops back in
    if (ko && !ko.respawned && phase === 'break' && breakEndsAt - uiTime < 3.2) {
      ko.respawned = true;
      hud.freeze(false);
      frozenScores = null;
      hud.hideResult();
      for (const f of Object.values(fighters)) {
        if (f.state === 'gone' || f.state === 'falling') f.dropIn();
        else if (f.state === 'victory') f.resetForFight();
      }
    }

    for (const f of Object.values(fighters)) f.update(dt, { floorY: arena.floorY, canAttack: phase === 'fight' && !ko });
  }
  arena.update(dt);
  particles.update(dt);
  transients.update(dt);
  hud.update(uiTime);

  // camera: gentle sway + shake
  trauma = Math.max(0, trauma - realDt * 1.6);
  const shake = trauma * trauma * 0.35;
  const t = uiTime * 30;
  camera.position.set(
    cameraHome.x + Math.sin(uiTime * 0.3) * 0.25 + Math.sin(t * 1.1) * shake,
    cameraHome.y + Math.sin(t * 1.7 + 1) * shake,
    cameraHome.z,
  );
  const faller = ko?.loser && fighters[ko.loser].state === 'falling' ? fighters[ko.loser].root.position.y : 0;
  lookY += (lookAt.y + THREE.MathUtils.clamp(faller * 0.12, -1.2, 0) - lookY) * Math.min(1, realDt * 3);
  camera.lookAt(lookAt.x, lookY + Math.sin(t * 1.3 + 2) * shake * 0.5, lookAt.z);
  composer.render(dt);
}

// ---------- start ----------
async function start() {
  const gltf = await new GLTFLoader().loadAsync('/models/RobotExpressive.glb');
  fighters = { red: new Fighter(gltf, 'red'), blue: new Fighter(gltf, 'blue') };
  for (const f of Object.values(fighters)) {
    Object.assign(f, { onImpact, onLand, onSuperCharge });
    f.root.position.x = f.baseX;
    scene.add(f.root);
  }
  await document.fonts.ready;
  document.getElementById('loading').hidden = true;
  document.getElementById('hud').hidden = false;

  hud.onCountdown = () => sfx.play('beep');
  const hint = document.getElementById('sound-hint');
  hint.hidden = !sfx.blocked;
  hint.addEventListener('click', () => {
    sfx.unlock();
    hint.hidden = true;
  });

  connect();
  window.__gameReady = true;
  window.__game = { scene, camera, fighters };
}

frame();
start();
