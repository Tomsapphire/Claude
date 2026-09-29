import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { COLORS, softDot } from './arena.js';

export const HEIGHT = 2.0;
const GRAVITY = 18;
const ONE_SHOTS = ['Punch', 'Jump', 'Death', 'Yes', 'No', 'ThumbsUp', 'Wave'];

// How big an attack a gift turns into
export function attackKind(diamonds) {
  if (diamonds >= 1000) return 'super';
  if (diamonds >= 250) return 'smash';
  if (diamonds >= 20) return 'heavy';
  return 'jab';
}

// A damped spring: value is pulled back to 0
class Spring {
  constructor(stiffness, damping) {
    Object.assign(this, { stiffness, damping, value: 0, velocity: 0 });
  }
  kick(v) {
    this.velocity += v;
  }
  update(dt) {
    this.velocity += (-this.stiffness * this.value - this.damping * this.velocity) * dt;
    this.value += this.velocity * dt;
  }
}

export class Fighter {
  constructor(gltf, side) {
    this.side = side;
    this.dir = side === 'red' ? 1 : -1; // red faces +x, blue faces -x
    this.color = COLORS[side];

    // root (position) > lean (tilts from the feet) > spin (rotates around the belly) > model
    this.root = new THREE.Group();
    this.lean = new THREE.Group();
    this.spin = new THREE.Group();
    this.spin.position.y = HEIGHT / 2;
    this.root.add(this.lean);
    this.lean.add(this.spin);

    const model = SkeletonUtils.clone(gltf.scene);
    model.updateMatrixWorld(true); // bones must be posed before measuring, or the hands measure huge
    const box = new THREE.Box3().setFromObject(model);
    model.scale.setScalar(HEIGHT / (box.max.y - box.min.y));
    model.position.y = -HEIGHT / 2;
    model.rotation.y = this.dir * (Math.PI / 2 - 0.55); // face the opponent, turned a bit toward the camera
    this.spin.add(model);

    this.materials = [];
    this.faces = [];
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.frustumCulled = false;
      o.material = o.material.clone();
      if (o.material.name === 'Main') {
        o.material.color.copy(this.color);
        o.material.metalness = 0.45;
        o.material.roughness = 0.3;
      }
      o.material.emissive = this.color.clone().lerp(new THREE.Color('#ffffff'), 0.2);
      o.material.emissiveIntensity = 0;
      this.materials.push(o.material);
      if (o.morphTargetDictionary?.Surprised !== undefined) this.faces.push(o);
    });

    // Glowing team ring on the floor
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 0.8, 48),
      new THREE.MeshBasicMaterial({ color: this.color.clone().multiplyScalar(2.5), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.02;
    this.root.add(this.ring);

    // Power-up aura for super attacks
    this.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, color: this.color.clone().multiplyScalar(0.75), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.aura.position.set(0, HEIGHT / 2, -0.9); // behind the robot, so it glows around it
    this.aura.scale.setScalar(3);
    this.root.add(this.aura);

    this.mixer = new THREE.AnimationMixer(model);
    this.actions = Object.fromEntries(gltf.animations.map((clip) => [clip.name, this.mixer.clipAction(clip)]));
    for (const name of ONE_SHOTS) {
      this.actions[name].setLoop(THREE.LoopOnce);
      this.actions[name].clampWhenFinished = true;
    }
    this.current = this.actions.Idle;
    this.current.play();
    this.mixer.addEventListener('finished', (e) => {
      if (e.action === this.current && this.state === 'fighting') this.play('Idle', { fade: 0.15 });
    });

    this.knock = new Spring(45, 8); // pushed backwards when hit
    this.tilt = new Spring(70, 9); // leaning back when hit
    this.lunge = 0;
    this.lungeTarget = 0;
    this.baseX = this.homeX = -this.dir * 0.85;
    this.hop = 0;
    this.flash = 0;
    this.surprise = 0;
    this.auraLevel = 0;
    this.velocity = new THREE.Vector3();
    this.spinSpeed = 0;
    this.queue = [];
    this.timeline = [];
    this.clock = 0;
    this.busy = false;
    this.state = 'fighting'; // fighting | falling | gone | dropping | victory
    this.onImpact = () => {};
    this.onLand = () => {};
    this.onSuperCharge = () => {};
  }

  play(name, { fade = 0.1, speed = 1 } = {}) {
    const next = this.actions[name];
    next.reset().setEffectiveTimeScale(speed).setEffectiveWeight(1).play();
    if (this.current !== next) this.current.crossFadeTo(next, fade, false);
    this.current = next;
  }

  after(seconds, fn) {
    this.timeline.push({ at: this.clock + seconds, fn });
  }

  queueAttack(hit) {
    this.queue.push(hit);
    // Too many gifts at once: squash the oldest small ones together so the fight keeps up
    if (this.queue.length > 6) {
      const merged = this.queue.splice(0, this.queue.length - 4);
      this.queue.unshift({ ...merged.at(-1), diamonds: merged.reduce((sum, h) => sum + h.diamonds, 0) });
    }
  }

  startAttack(hit) {
    const kind = attackKind(hit.diamonds);
    this.busy = true;
    if (kind === 'jab' || kind === 'heavy') {
      const speed = kind === 'jab' ? Math.min(3, 1.7 + this.queue.length * 0.25) : 1.25;
      this.play('Punch', { fade: 0.06, speed });
      this.lungeTarget = kind === 'heavy' ? 0.45 : 0.15;
      this.after(0.34 / speed, () => {
        this.onImpact(this, hit, kind);
        this.lungeTarget = 0;
      });
      this.after(0.6 / speed, () => (this.busy = false));
    } else if (kind === 'smash') {
      this.play('Jump', { fade: 0.08, speed: 0.8 });
      this.lungeTarget = 0.9;
      this.hopTime = 0;
      this.after(0.8, () => {
        this.onImpact(this, hit, kind);
        this.lungeTarget = 0;
      });
      this.after(1.1, () => (this.busy = false));
    } else {
      // super: charge up, then punch a blast
      this.auraTarget = 1;
      this.play('Yes', { fade: 0.1, speed: 1.4 });
      this.onSuperCharge(this, hit);
      this.after(0.9, () => {
        this.play('Punch', { fade: 0.06, speed: 1.1 });
        this.lungeTarget = 0.3;
      });
      this.after(0.9 + 0.3, () => {
        this.auraTarget = 0;
        this.lungeTarget = 0;
        this.onImpact(this, hit, kind);
      });
      this.after(1.6, () => (this.busy = false));
    }
  }

  takeHit(kind) {
    const power = { jab: 1.6, heavy: 3.2, smash: 5.5, super: 8 }[kind];
    this.knock.kick(power);
    this.tilt.kick(power * 1.3);
    this.flash = { jab: 0.12, heavy: 0.25, smash: 0.4, super: 0.55 }[kind];
    this.surprise = 1;
  }

  // K.O.: knocked off the arena, falls off the screen
  launch() {
    this.state = 'falling';
    this.queue.length = 0;
    this.timeline.length = 0;
    this.busy = false;
    this.auraTarget = 0;
    // up and toward the camera: over the front edge of the arena and down off the bottom of the screen
    this.velocity.set(this.dir * 0.9, 6.5, 4.8);
    this.spinSpeed = -6;
    this.play('Death', { fade: 0.05, speed: 0.8 });
    this.surprise = 1;
  }

  victory() {
    this.state = 'victory';
    this.queue.length = 0;
    this.auraTarget = 0;
    this.play('Dance', { fade: 0.3 });
  }

  shrug() {
    this.play('No', { fade: 0.2 });
  }

  // Back to the start position for the next fight
  resetForFight() {
    this.queue.length = 0;
    this.timeline.length = 0;
    this.busy = false;
    this.lunge = this.lungeTarget = 0;
    this.auraTarget = 0;
    if (this.state === 'falling' || this.state === 'gone') this.dropIn();
    else if (this.state !== 'dropping') {
      this.state = 'fighting';
      this.play('Idle', { fade: 0.3 });
    }
  }

  dropIn() {
    this.state = 'dropping';
    this.root.visible = true;
    this.baseX = this.homeX;
    this.root.position.set(this.baseX, 14, 0);
    this.velocity.set(0, 0, 0);
    this.spinSpeed = 0;
    this.spin.rotation.set(0, 0, 0);
    this.play('Jump', { fade: 0.05, speed: 0.4 });
  }

  update(dt, { floorY, canAttack }) {
    this.clock += dt;
    this.mixer.update(dt);
    for (const item of this.timeline.filter((t) => t.at <= this.clock)) {
      this.timeline.splice(this.timeline.indexOf(item), 1);
      item.fn();
    }

    if (this.state === 'fighting' && canAttack && !this.busy && this.queue.length) this.startAttack(this.queue.shift());

    this.knock.update(dt);
    this.tilt.update(dt);
    this.lunge += (this.lungeTarget - this.lunge) * Math.min(1, dt * 14);
    this.flash = Math.max(0, this.flash - dt * 3.5);
    this.surprise = Math.max(0, this.surprise - dt * 1.5);
    this.auraLevel += ((this.auraTarget ?? 0) - this.auraLevel) * Math.min(1, dt * 6);
    for (const m of this.materials) m.emissiveIntensity = this.flash;
    for (const face of this.faces) {
      const dict = face.morphTargetDictionary;
      face.morphTargetInfluences[dict.Surprised] = this.surprise;
      face.morphTargetInfluences[dict.Angry] = this.state === 'fighting' ? 0.8 * (1 - this.surprise) : 0;
    }
    this.aura.material.opacity = this.auraLevel * (0.4 + Math.sin(this.clock * 30) * 0.1);
    this.aura.scale.setScalar(2.4 + this.auraLevel * 0.9 + Math.sin(this.clock * 12) * 0.2);
    this.ring.material.opacity = 0.35 + Math.sin(this.clock * 4) * 0.15 + this.auraLevel * 0.5;
    this.ring.scale.setScalar(1 + this.auraLevel * (0.5 + Math.sin(this.clock * 20) * 0.1));

    const pos = this.root.position;
    if (this.state === 'falling') {
      this.velocity.y -= GRAVITY * dt;
      this.velocity.x *= Math.max(0, 1 - dt * 0.8);
      pos.addScaledVector(this.velocity, dt);
      this.spin.rotation.x += this.spinSpeed * dt;
      this.spin.rotation.z += this.dir * 1.5 * dt;
      this.ring.visible = false;
      if (pos.y < -40) {
        this.state = 'gone';
        this.root.visible = false;
      }
      return;
    }
    if (this.state === 'gone') return;
    if (this.state === 'dropping') {
      this.velocity.y -= GRAVITY * 0.7 * dt;
      pos.y += this.velocity.y * dt;
      if (pos.y <= floorY) {
        pos.y = floorY;
        this.state = 'fighting';
        this.ring.visible = true;
        this.play('Idle', { fade: 0.2 });
        this.onLand(this);
      }
      pos.x = this.baseX;
      return;
    }

    // Jump arc for smash attacks
    if (this.current === this.actions.Jump && this.busy) {
      this.hopTime = (this.hopTime ?? 0) + dt;
      this.hop = Math.max(0, Math.sin(Math.min(1, this.hopTime / 0.8) * Math.PI)) * 1.3;
    } else {
      this.hop += (0 - this.hop) * Math.min(1, dt * 12);
    }

    this.baseX += (this.homeX - this.baseX) * Math.min(1, dt * 2.5);
    pos.x = this.baseX + this.dir * (this.lunge - this.knock.value * 0.35);
    pos.y = floorY + this.hop;
    pos.z = 0;
    this.lean.rotation.z = this.dir * this.tilt.value * 0.25;
  }

  // Where punches land (chest height), in world space
  chest(target = new THREE.Vector3()) {
    return this.spin.getWorldPosition(target).add(new THREE.Vector3(0, 0.25, 0));
  }
}
