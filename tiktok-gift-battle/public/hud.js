import { FIGHTERS } from './battle.js';

const $ = (id) => document.getElementById(id);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const easeOutBack = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
const easeOutCubic = (p) => 1 - (1 - p) ** 3;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // viewer names are always set as text, never HTML
  return node;
}

function avatar(side, name, url) {
  const wrap = el('div', `avatar ${side}`);
  if (url) {
    const img = el('img');
    img.src = url;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => img.remove();
    wrap.append(img);
  }
  wrap.append(el('span', '', (name || '?').slice(0, 1).toUpperCase()));
  return wrap;
}

// Every HUD animation is driven from the game loop (not CSS), so it follows the game clock
export class Hud {
  constructor() {
    this.now = 0;
    this.anims = [];
    this.shown = { red: 0, blue: 0 };
    this.target = { red: 0, blue: 0 };
    this.share = 0.5;
    this.endsAt = 0;
    this.phase = 'fight';
    this.lastCountdown = null;
    this.frozen = false;
    this.onCountdown = () => {};
  }

  animate(node, duration, fn, onDone) {
    const anim = { node, start: this.now, duration, fn, onDone };
    this.anims.push(anim);
    fn(0);
    return anim;
  }

  setState(state) {
    this.phase = state.phase;
    this.endsAt = this.now + state.remainingMs / 1000;
    $('round').textContent = state.phase === 'fight' ? `ROUND ${state.round}` : 'NEXT FIGHT';
    if (this.frozen) {
      this.pending = state;
      return;
    }
    this.applyScores(state);
  }

  applyScores(state) {
    this.target = { red: state.red.diamonds, blue: state.blue.diamonds };
    for (const side of ['red', 'blue']) {
      const list = $(`top-${side}`);
      list.replaceChildren(...state[side].top.map((p, i) => {
        const row = el('li');
        row.append(el('span', 'medal', ['🥇', '🥈', '🥉'][i]), el('span', 'who', p.name), el('span', 'gems', `${fmt(p.diamonds)}💎`));
        return row;
      }));
    }
  }

  // Hold the final score on screen during the K.O. sequence
  freeze(frozen) {
    this.frozen = frozen;
    if (!frozen && this.pending) this.applyScores(this.pending);
    this.pending = null;
  }

  update(now) {
    this.now = now;

    // count-up totals and the tug-of-war bar
    for (const side of ['red', 'blue']) {
      this.shown[side] += (this.target[side] - this.shown[side]) * 0.18;
      if (Math.abs(this.target[side] - this.shown[side]) < 0.5) this.shown[side] = this.target[side];
      $(`${side}-total`).textContent = fmt(this.shown[side]);
    }
    const total = this.target.red + this.target.blue;
    const share = total ? this.target.red / total : 0.5;
    this.share += (share - this.share) * 0.12;
    const pct = 6 + this.share * 88; // keep a sliver of each color visible
    $('bar-red').style.width = `${pct}%`;
    $('spark').style.left = `${pct}%`;
    $('pct-red').textContent = `${Math.round(share * 100)}%`;
    $('pct-blue').textContent = `${100 - Math.round(share * 100)}%`;

    // timer and final countdown
    const remaining = Math.max(0, this.endsAt - now);
    const secs = Math.ceil(remaining);
    $('time').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    $('time').classList.toggle('hurry', this.phase === 'fight' && secs <= 10);
    if (this.phase === 'fight' && secs <= 10 && secs >= 1 && secs !== this.lastCountdown) {
      this.lastCountdown = secs;
      this.countdown(secs);
    }
    if (this.phase !== 'fight' || secs > 10) this.lastCountdown = null;
    const next = $('next-in');
    if (next) next.textContent = this.phase === 'break' ? `Next fight in ${secs}s` : '';

    for (const a of [...this.anims]) {
      const p = clamp01((now - a.start) / a.duration);
      a.fn(p);
      if (p >= 1) {
        this.anims.splice(this.anims.indexOf(a), 1);
        a.onDone?.();
      }
    }
  }

  countdown(n) {
    const node = el('div', 'countdown', String(n));
    $('overlay').append(node);
    this.onCountdown(n);
    this.animate(node, 0.95, (p) => {
      const pop = p < 0.15 ? easeOutBack(p / 0.15) : 1;
      node.style.transform = `translate(-50%, -50%) scale(${0.5 + pop * 0.6 - p * 0.15})`;
      node.style.opacity = String(p < 0.6 ? 0.9 : 0.9 * (1 - (p - 0.6) / 0.4));
    }, () => node.remove());
  }

  callout(text, { side = null, size = 1, duration = 1.4, sub = '' } = {}) {
    const node = el('div', `callout ${side ?? ''}`);
    node.style.setProperty('--size', size);
    node.append(el('div', 'callout-main', text));
    if (sub) node.append(el('div', 'callout-sub', sub));
    $('overlay').append(node);
    this.animate(node, duration, (p) => {
      const inP = clamp01(p / 0.18);
      const scale = p < 0.18 ? 2.2 - easeOutBack(inP) * 1.2 : 1 + (p - 0.18) * 0.08;
      node.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${(1 - inP) * -6}deg)`;
      node.style.opacity = String(p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2);
    }, () => node.remove());
  }

  // Damage number floating up from a point on screen
  damage(x, y, text, side, big = false) {
    const node = el('div', `damage ${side}${big ? ' big' : ''}`, text);
    $('overlay').append(node);
    const drift = (Math.random() - 0.5) * 40;
    this.animate(node, 1.1, (p) => {
      const pop = p < 0.15 ? easeOutBack(p / 0.15) : 1;
      node.style.transform = `translate(calc(-50% + ${drift * p}px), calc(-50% - ${easeOutCubic(p) * 90}px)) scale(${pop})`;
      node.style.opacity = String(p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3);
    }, () => node.remove());
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
  }

  toast({ side, name, avatar: url, giftName, taps, diamonds, joined }) {
    const feed = $('feed');
    // taps of the same combo update one toast instead of flooding the feed
    const key = `${side}|${name}|${giftName}|${joined ? 'join' : 'gift'}`;
    const open = this.toasts?.get(key);
    if (open && open.node.isConnected && this.now - open.anim.start < 2.5 && !joined) {
      open.taps += taps;
      open.diamonds += diamonds;
      open.label.textContent = ` ${giftName} x${open.taps}`;
      open.gems.textContent = `+${fmt(open.diamonds)}💎`;
      open.anim.start = this.now - 0.08 * 4.2; // restart the timer, skip the slide-in
      return;
    }
    const node = el('div', `toast ${side}`);
    const text = el('div', 'toast-text');
    text.append(el('b', '', name));
    const label = el('span', '', joined ? ` joined ${FIGHTERS[side].icon} ${FIGHTERS[side].name}` : ` ${giftName}${taps > 1 ? ` x${taps}` : ''}`);
    const gems = el('div', 'toast-gems', `+${fmt(diamonds)}💎`);
    text.append(label);
    node.append(avatar(side, name, url), text);
    if (!joined) node.append(gems);
    feed.append(node);
    while (feed.children.length > 5) feed.firstChild.remove();
    const from = side === 'red' ? -60 : 60;
    const anim = this.animate(node, 4.2, (p) => {
      const inP = easeOutCubic(clamp01(p / 0.08));
      node.style.transform = `translateX(${(1 - inP) * from}px)`;
      node.style.opacity = String(Math.min(inP, p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1));
    }, () => {
      node.remove();
      if (this.toasts.get(key)?.node === node) this.toasts.delete(key);
    });
    this.toasts ??= new Map();
    this.toasts.set(key, { node, anim, label, gems, taps, diamonds });
  }

  flash(color, strength = 0.6) {
    const node = $('flash');
    node.style.background = color;
    this.animate(node, 0.35, (p) => (node.style.opacity = String(strength * (1 - p))));
  }

  showResult({ winner, red, blue, mvp }) {
    const card = $('result');
    card.className = `result ${winner ?? 'draw'}`;
    card.replaceChildren();
    if (winner) {
      const f = FIGHTERS[winner];
      card.append(
        el('div', 'result-title', `${f.icon} ${f.name} WINS!`),
        el('div', 'result-score', `💎 ${fmt(red)}  vs  ${fmt(blue)} 💎`),
      );
      if (mvp) {
        const row = el('div', 'result-mvp');
        row.append(el('span', 'crown', '👑 MVP'), avatar(winner, mvp.name, mvp.avatar), el('b', '', mvp.name), el('span', '', `${fmt(mvp.diamonds)}💎`));
        card.append(row);
      }
    } else {
      card.append(el('div', 'result-title', 'DRAW!'), el('div', 'result-score', `💎 ${fmt(red)}  vs  ${fmt(blue)} 💎`));
    }
    card.append(el('div', 'result-next', ''));
    card.lastChild.id = 'next-in';
    card.hidden = false;
    this.animate(card, 0.5, (p) => {
      card.style.transform = `translate(-50%, -50%) scale(${0.6 + easeOutBack(p) * 0.4})`;
      card.style.opacity = String(Math.min(1, p * 3));
    });
  }

  hideResult() {
    const card = $('result');
    if (card.hidden || this.hidingResult) return;
    this.hidingResult = true;
    this.animate(card, 0.3, (p) => {
      card.style.opacity = String(1 - p);
      card.style.transform = `translate(-50%, -50%) scale(${1 - p * 0.2})`;
    }, () => {
      card.hidden = true;
      this.hidingResult = false;
    });
  }
}
