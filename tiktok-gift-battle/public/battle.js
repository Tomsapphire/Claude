// Fight rules. Shared by the server (real TikTok LIVE) and the browser demo mode (?demo).
// No imports and no Node/browser specifics, so both sides can run the exact same code.

export const FIGHTERS = {
  red: { name: 'BLAZE', icon: '🔥', command: '1' },
  blue: { name: 'FROST', icon: '❄️', command: '2' },
};

const RED_WORDS = ['1', 'red', 'blaze', '🔥', '🔴'];
const BLUE_WORDS = ['2', 'blue', 'frost', '❄️', '❄', '🔵'];

// "1" / "red" / "blaze" in chat joins the red fighter, "2" / "blue" / "frost" the blue one
export function sideFromComment(text) {
  const word = String(text ?? '').trim().toLowerCase();
  if (RED_WORDS.includes(word)) return 'red';
  if (BLUE_WORDS.includes(word)) return 'blue';
  return null;
}

export class Battle {
  constructor({ roundSeconds = 120, breakSeconds = 15, now = () => Date.now(), emit = () => {} } = {}) {
    this.roundSeconds = roundSeconds;
    this.breakSeconds = breakSeconds;
    this.now = now;
    this.emit = emit;
    this.teams = new Map(); // viewerId -> side, kept between rounds
    this.streaks = new Map(); // combo key -> taps already counted
    this.round = 1;
    this.phase = 'fight';
    this.endsAt = now() + roundSeconds * 1000;
    this.resetScores();
  }

  resetScores() {
    this.scores = { red: 0, blue: 0 };
    this.players = new Map(); // `${viewerId}:${side}` -> { name, avatar, side, diamonds }
  }

  // A viewer picks a side by commenting
  join(user, side) {
    if (this.teams.get(user.id) === side) return;
    this.teams.set(user.id, side);
    this.emit('join', { side, name: user.name, avatar: user.avatar });
  }

  // Every gift event from TikTok. Combo gifts (streakable) arrive as several events with a
  // growing repeatCount, so only the taps we haven't counted yet are added.
  gift({ user, giftId, giftName, diamondCount, repeatCount = 1, repeatEnd = false, streakable = false, groupId = '' }) {
    let taps = repeatCount || 1;
    if (streakable) {
      const key = `${user.id}:${giftId}:${groupId}`;
      const counted = this.streaks.get(key) ?? 0;
      taps = repeatCount >= counted ? repeatCount - counted : repeatCount; // lower count = a new combo
      if (repeatEnd) this.streaks.delete(key);
      else this.streaks.set(key, repeatCount);
    }
    if (taps <= 0) return;

    const diamonds = Math.max(1, diamondCount || 1) * taps;
    const side = this.teams.get(user.id) ?? this.underdog(); // no side picked yet: help whoever is behind
    this.teams.set(user.id, side);
    this.scores[side] += diamonds;

    const key = `${user.id}:${side}`;
    const player = this.players.get(key) ?? { name: user.name, avatar: user.avatar, side, diamonds: 0 };
    player.diamonds += diamonds;
    this.players.set(key, player);

    this.emit('gift', { side, name: user.name, avatar: user.avatar, giftName, taps, diamonds, fighting: this.phase === 'fight' });
    this.emit('state', this.snapshot());
  }

  underdog() {
    if (this.scores.red !== this.scores.blue) return this.scores.red < this.scores.blue ? 'red' : 'blue';
    const supporters = { red: 0, blue: 0 };
    for (const side of this.teams.values()) supporters[side] += 1;
    return supporters.red <= supporters.blue ? 'red' : 'blue';
  }

  top(side, count = 3) {
    return [...this.players.values()]
      .filter((p) => p.side === side)
      .sort((a, b) => b.diamonds - a.diamonds)
      .slice(0, count);
  }

  snapshot() {
    return {
      round: this.round,
      phase: this.phase,
      remainingMs: Math.max(0, this.endsAt - this.now()),
      red: { diamonds: this.scores.red, top: this.top('red') },
      blue: { diamonds: this.scores.blue, top: this.top('blue') },
    };
  }

  // Call a few times per second
  tick() {
    if (this.now() < this.endsAt) return;
    if (this.phase === 'fight') this.finishRound();
    else this.startRound();
  }

  finishRound() {
    const { red, blue } = this.scores;
    const winner = red === blue ? null : red > blue ? 'red' : 'blue';
    this.emit('ko', {
      round: this.round,
      winner,
      loser: winner && (winner === 'red' ? 'blue' : 'red'),
      red,
      blue,
      mvp: winner ? this.top(winner, 1)[0] ?? null : null,
    });
    // Gifts sent during the break already count for the next fight
    this.resetScores();
    this.phase = 'break';
    this.endsAt = this.now() + this.breakSeconds * 1000;
    this.emit('state', this.snapshot());
  }

  startRound() {
    this.round += 1;
    this.phase = 'fight';
    this.endsAt = this.now() + this.roundSeconds * 1000;
    this.emit('state', this.snapshot());
  }
}
