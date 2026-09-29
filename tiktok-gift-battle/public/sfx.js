// Tiny synthesized sound effects (no audio files needed). Add ?sound=0 to the URL to mute.
export class Sfx {
  constructor(enabled = true) {
    this.enabled = enabled && 'AudioContext' in window;
    if (!this.enabled) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  // Browsers only allow sound after a click; OBS browser sources allow it straight away
  get blocked() {
    return this.enabled && this.ctx.state !== 'running';
  }

  unlock() {
    if (this.enabled) this.ctx.resume();
  }

  noiseHit({ duration = 0.15, freq = 800, q = 1, volume = 0.6, type = 'lowpass', sweepTo = null }) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + duration);
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t, Math.random() * 0.5, duration + 0.05);
  }

  tone({ from, to = from, duration = 0.2, volume = 0.5, type = 'sine', delay = 0 }) {
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  play(name) {
    if (this.blocked || !this.enabled) return;
    switch (name) {
      case 'jab':
        this.noiseHit({ duration: 0.08, freq: 1800, volume: 0.35 });
        this.tone({ from: 180, to: 60, duration: 0.08, volume: 0.4 });
        break;
      case 'heavy':
        this.noiseHit({ duration: 0.18, freq: 1200, volume: 0.5 });
        this.tone({ from: 140, to: 40, duration: 0.2, volume: 0.7 });
        break;
      case 'smash':
        this.noiseHit({ duration: 0.5, freq: 900, sweepTo: 80, volume: 0.7 });
        this.tone({ from: 90, to: 30, duration: 0.5, volume: 0.9 });
        break;
      case 'super':
        this.noiseHit({ duration: 0.9, freq: 3000, sweepTo: 60, volume: 0.8 });
        this.tone({ from: 70, to: 25, duration: 0.9, volume: 1, type: 'triangle' });
        break;
      case 'charge':
        this.tone({ from: 200, to: 900, duration: 0.9, volume: 0.25, type: 'sawtooth' });
        break;
      case 'whoosh':
        this.noiseHit({ duration: 1.2, freq: 400, sweepTo: 3000, q: 4, volume: 0.35, type: 'bandpass' });
        break;
      case 'land':
        this.noiseHit({ duration: 0.3, freq: 500, volume: 0.6 });
        this.tone({ from: 110, to: 35, duration: 0.3, volume: 0.8 });
        break;
      case 'bell':
        for (const [f, v] of [[880, 0.5], [1320, 0.25], [2200, 0.12]]) this.tone({ from: f, duration: 1.6, volume: v, type: 'sine' });
        break;
      case 'beep':
        this.tone({ from: 1000, duration: 0.12, volume: 0.25, type: 'square' });
        break;
      case 'fight':
        this.tone({ from: 440, to: 880, duration: 0.25, volume: 0.35, type: 'square' });
        this.tone({ from: 660, to: 1320, duration: 0.35, volume: 0.3, type: 'square', delay: 0.12 });
        break;
      case 'cheer':
        this.noiseHit({ duration: 2.2, freq: 1500, q: 0.7, volume: 0.35, type: 'bandpass' });
        break;
      case 'join':
        this.tone({ from: 700, to: 1100, duration: 0.12, volume: 0.15, type: 'triangle' });
        break;
    }
  }
}
