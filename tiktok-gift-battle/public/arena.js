import * as THREE from 'three';

export const ARENA_RADIUS = 2.8;
export const COLORS = {
  red: new THREE.Color('#ff3355'),
  blue: new THREE.Color('#22a6ff'),
  gold: new THREE.Color('#ffd54a'),
};

// Bright colors (> 1) glow through the bloom pass
const neon = (color, strength) => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(strength), toneMapped: false });

function canvasTexture(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function skyDome() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color('#05020f') },
      middle: { value: new THREE.Color('#1a0838') },
      horizon: { value: new THREE.Color('#5c1a66') },
      bottom: { value: new THREE.Color('#0a0314') },
    },
    vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 top, middle, horizon, bottom; varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 c = h > 0.0 ? mix(mix(horizon, middle, smoothstep(0.0, 0.25, h)), top, smoothstep(0.25, 0.8, h))
                         : mix(horizon, bottom, smoothstep(0.0, 0.35, -h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), material);
}

function stars() {
  const count = 1400;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const y = 0.05 + Math.random() * 0.95;
    const r = Math.sqrt(1 - y * y);
    positions.set([Math.cos(theta) * r * 150, y * 150, Math.sin(theta) * r * 150], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true, transparent: true, opacity: 0.85, fog: false }));
}

const softDot = canvasTexture(128, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
});
export { softDot };

function floorTexture() {
  return canvasTexture(1024, (ctx, s) => {
    const c = s / 2;
    // red half / blue half
    const red = ctx.createLinearGradient(0, 0, c, 0);
    red.addColorStop(0, '#5a0f25');
    red.addColorStop(1, '#241033');
    ctx.fillStyle = red;
    ctx.fillRect(0, 0, c, s);
    const blue = ctx.createLinearGradient(s, 0, c, 0);
    blue.addColorStop(0, '#0b3060');
    blue.addColorStop(1, '#241033');
    ctx.fillStyle = blue;
    ctx.fillRect(c, 0, c, s);
    // hex grid
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 2;
    const r = 34;
    for (let y = 0; y < s + r; y += r * 1.5) {
      for (let x = 0; x < s + r; x += r * Math.sqrt(3)) {
        const ox = (Math.round(y / (r * 1.5)) % 2) * (r * Math.sqrt(3)) / 2;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + (k * Math.PI) / 3;
          ctx.lineTo(x + ox + Math.cos(a) * r, y + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    // rings and center line
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 6;
    for (const radius of [0.93, 0.35]) {
      ctx.beginPath();
      ctx.arc(c, c, c * radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(c, c * 0.07);
    ctx.lineTo(c, s - c * 0.07);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.font = `bold ${s * 0.13}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VS', c, c);
  });
}

function lightBeam(color) {
  const geometry = new THREE.ConeGeometry(1.6, 40, 32, 1, true);
  geometry.translate(0, -20, 0); // tip at the origin, cone opening away from it
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
    uniforms: { color: { value: color.clone() } },
    vertexShader: `varying float vY; void main() { vY = -position.y / 40.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color; varying float vY; void main() { gl_FragColor = vec4(color, 0.16 * (1.0 - vY) * smoothstep(0.0, 0.08, vY)); }`,
  });
  return new THREE.Mesh(geometry, material);
}

export function createArena(scene) {
  scene.fog = new THREE.Fog('#1c0833', 22, 60);
  scene.add(skyDome(), stars());

  // Lights
  scene.add(new THREE.HemisphereLight('#a89bff', '#2a0c45', 1.1));
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  key.position.set(2, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 });
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rimRed = new THREE.PointLight(COLORS.red, 60, 12);
  rimRed.position.set(-4, 3, -2.5);
  const rimBlue = new THREE.PointLight(COLORS.blue, 60, 12);
  rimBlue.position.set(4, 3, -2.5);
  scene.add(rimRed, rimBlue);

  // Platform
  const platform = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(ARENA_RADIUS, ARENA_RADIUS * 0.94, 0.5, 64),
    new THREE.MeshStandardMaterial({ color: '#1b1433', metalness: 0.7, roughness: 0.35 }),
  );
  body.position.y = -0.25;
  body.receiveShadow = true;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ARENA_RADIUS - 0.02, 64),
    new THREE.MeshStandardMaterial({ map: floorTexture(), metalness: 0.35, roughness: 0.45 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  // neon rim: red half on the left, blue half on the right
  const rimLeft = new THREE.Mesh(new THREE.TorusGeometry(ARENA_RADIUS, 0.055, 12, 96, Math.PI), neon(COLORS.red, 3));
  rimLeft.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  const rimRight = new THREE.Mesh(new THREE.TorusGeometry(ARENA_RADIUS, 0.055, 12, 96, Math.PI), neon(COLORS.blue, 3));
  rimRight.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  const lowerRim = new THREE.Mesh(new THREE.TorusGeometry(ARENA_RADIUS * 0.94, 0.03, 8, 96), neon(new THREE.Color('#b35cff'), 2.2));
  lowerRim.rotation.x = Math.PI / 2;
  lowerRim.position.y = -0.5;
  // the "engine" under the floating arena
  const underside = new THREE.Mesh(
    new THREE.ConeGeometry(ARENA_RADIUS * 0.94, 3.2, 8, 1, true),
    new THREE.MeshStandardMaterial({ color: '#140d28', metalness: 0.8, roughness: 0.4, side: THREE.DoubleSide }),
  );
  underside.rotation.x = Math.PI;
  underside.position.y = -2.1;
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 16), neon(new THREE.Color('#c77dff'), 2.5));
  core.position.y = -3.6;
  const coreLight = new THREE.PointLight('#c77dff', 12, 6);
  coreLight.position.y = -3.4;
  platform.add(body, floor, rimLeft, rimRight, lowerRim, underside, core, coreLight);
  scene.add(platform);

  // Big glowing halo behind the arena
  const halo = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.09, 12, 160), neon(new THREE.Color('#ff4fd8'), 2.2));
  halo.position.set(0, 2.5, -14);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.05, 12, 160), neon(new THREE.Color('#7b5cff'), 2));
  halo2.position.set(0, 2.5, -15);
  scene.add(halo, halo2);

  // Search lights sweeping the sky
  const beams = [];
  [COLORS.red, COLORS.blue, new THREE.Color('#ff4fd8'), new THREE.Color('#7b5cff')].forEach((color, i) => {
    const beam = lightBeam(color);
    beam.position.set((i % 2 ? 1 : -1) * (4 + i * 1.5), -8, -12 - i);
    beam.rotation.x = Math.PI; // open upwards
    beams.push({ mesh: beam, phase: i * 1.7, side: i % 2 ? 1 : -1 });
    scene.add(beam);
  });

  // Clouds below the arena (the loser falls into them)
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: softDot,
      color: new THREE.Color().setHSL(0.8 + Math.random() * 0.12, 0.6, 0.45 + Math.random() * 0.2),
      transparent: true,
      opacity: 0.1 + Math.random() * 0.14,
      depthWrite: false,
      fog: false,
    }));
    const scale = 8 + Math.random() * 10;
    sprite.scale.set(scale, scale * 0.45, 1);
    sprite.position.set((Math.random() - 0.5) * 34, -7 - Math.random() * 9, -6 - Math.random() * 16);
    clouds.push({ sprite, speed: 0.15 + Math.random() * 0.35 });
    scene.add(sprite);
  }

  // Floating embers
  const emberCount = 160;
  const emberPositions = new Float32Array(emberCount * 3);
  const emberSpeed = new Float32Array(emberCount);
  for (let i = 0; i < emberCount; i++) {
    emberPositions.set([(Math.random() - 0.5) * 18, -6 + Math.random() * 16, -8 + Math.random() * 10], i * 3);
    emberSpeed[i] = 0.2 + Math.random() * 0.6;
  }
  const emberGeometry = new THREE.BufferGeometry();
  emberGeometry.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
  const embers = new THREE.Points(emberGeometry, new THREE.PointsMaterial({
    map: softDot, color: '#ffb3f0', size: 0.18, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(embers);

  let time = 0;
  return {
    update(dt) {
      time += dt;
      platform.position.y = Math.sin(time * 0.8) * 0.04;
      core.scale.setScalar(1 + Math.sin(time * 5) * 0.12);
      halo.rotation.z += dt * 0.1;
      halo2.rotation.z -= dt * 0.07;
      for (const b of beams) b.mesh.rotation.z = b.side * (0.35 + Math.sin(time * 0.5 + b.phase) * 0.3);
      for (const c of clouds) {
        c.sprite.position.x += c.speed * dt;
        if (c.sprite.position.x > 20) c.sprite.position.x = -20;
      }
      for (let i = 0; i < emberCount; i++) {
        emberPositions[i * 3 + 1] += emberSpeed[i] * dt;
        if (emberPositions[i * 3 + 1] > 10) emberPositions[i * 3 + 1] = -6;
      }
      emberGeometry.attributes.position.needsUpdate = true;
    },
    get floorY() {
      return platform.position.y;
    },
  };
}
