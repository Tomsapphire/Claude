import * as THREE from 'three';
import { softDot } from './arena.js';

// One big pool of glowing particles: sparks, dust, trails and confetti
export class Particles {
  constructor(scene, capacity = 2500) {
    this.capacity = capacity;
    this.items = [];
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.alphas = new Float32Array(capacity);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { map: { value: softDot }, scale: { value: 500 } },
      vertexShader: `
        attribute float size; attribute float alpha; attribute vec3 color;
        uniform float scale; varying vec3 vColor; varying float vAlpha;
        void main() {
          vColor = color; vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * scale / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D map; varying vec3 vColor; varying float vAlpha;
        void main() { vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vColor * 2.0, t.a * vAlpha); }`,
    });
    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit({ position, count, color, speed = 4, spread = 1, up = 0, direction = null, size = 0.25, life = 0.6, gravity = 6, drag = 2, colorJitter = 0.1 }) {
    const base = new THREE.Color(color);
    for (let i = 0; i < count && this.items.length < this.capacity; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(spread);
      if (direction) v.add(direction);
      v.normalize().multiplyScalar(speed * (0.4 + Math.random() * 0.8));
      v.y += up;
      const c = base.clone().offsetHSL((Math.random() - 0.5) * colorJitter, 0, (Math.random() - 0.5) * colorJitter);
      this.items.push({ p: position.clone(), v, c, size: size * (0.5 + Math.random()), life: life * (0.6 + Math.random() * 0.8), age: 0, gravity, drag });
    }
  }

  update(dt) {
    this.items = this.items.filter((it) => (it.age += dt) < it.life);
    this.items.forEach((it, i) => {
      it.v.y -= it.gravity * dt;
      it.v.multiplyScalar(Math.max(0, 1 - it.drag * dt));
      it.p.addScaledVector(it.v, dt);
      const fade = 1 - it.age / it.life;
      this.positions.set([it.p.x, it.p.y, it.p.z], i * 3);
      this.colors.set([it.c.r, it.c.g, it.c.b], i * 3);
      this.sizes[i] = it.size * (0.4 + fade * 0.6);
      this.alphas[i] = Math.min(1, fade * 1.5);
    });
    for (let i = this.items.length; i < this.capacity; i++) this.alphas[i] = 0;
    const attrs = this.points.geometry.attributes;
    for (const name of ['position', 'color', 'size', 'alpha']) attrs[name].needsUpdate = true;
  }
}

// Short-lived meshes that animate and then remove themselves (shockwaves, blasts)
export class Transients {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
  }

  add(object, duration, animate) {
    this.scene.add(object);
    this.items.push({ object, duration, animate, age: 0 });
  }

  shockwave(position, color, size = 4) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1, 64),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    this.add(ring, 0.6, (p) => {
      ring.scale.setScalar(0.2 + size * (1 - (1 - p) ** 3));
      ring.material.opacity = 1 - p;
    });
  }

  burst(position, color, size = 1.5) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    ball.position.copy(position);
    this.add(ball, 0.35, (p) => {
      ball.scale.setScalar(0.1 + size * p);
      ball.material.opacity = 0.55 * (1 - p) ** 2;
    });
  }

  // Energy ball flying from one point to another
  projectile(from, to, color, particles, onArrive) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(5), toneMapped: false }),
    );
    const light = new THREE.PointLight(color, 40, 6);
    orb.add(light);
    const start = from.clone();
    this.add(orb, 0.32, (p, done) => {
      orb.position.lerpVectors(start, to, p);
      orb.position.y += Math.sin(p * Math.PI) * 0.4;
      orb.scale.setScalar(1 + Math.sin(p * 40) * 0.15);
      particles.emit({ position: orb.position, count: 6, color, speed: 1.2, size: 0.35, life: 0.35, gravity: 0 });
      if (done) onArrive();
    });
  }

  update(dt) {
    for (const it of [...this.items]) {
      it.age += dt;
      const done = it.age >= it.duration;
      it.animate(Math.min(1, it.age / it.duration), done);
      if (done) {
        this.scene.remove(it.object);
        it.object.traverse((o) => {
          o.geometry?.dispose();
          o.material?.dispose();
        });
        this.items.splice(this.items.indexOf(it), 1);
      }
    }
  }
}
