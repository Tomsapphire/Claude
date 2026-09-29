// Fake viewers for testing without going LIVE. They comment "1"/"2" and send gifts shaped like
// real TikTok gift events (including combos), so everything goes through the real rules.

const GIFTS = [
  { id: 5655, name: 'Rose', diamonds: 1, combo: true, weight: 38 },
  { id: 5487, name: 'Finger Heart', diamonds: 5, combo: true, weight: 24 },
  { id: 5879, name: 'Doughnut', diamonds: 30, combo: true, weight: 16 },
  { id: 6427, name: 'Hat and Mustache', diamonds: 99, combo: false, weight: 11 },
  { id: 6267, name: 'Corgi', diamonds: 299, combo: false, weight: 7 },
  { id: 9947, name: 'Galaxy', diamonds: 1000, combo: false, weight: 4 },
];

const NAMES = ['Alice', 'Bob', 'Chloe', 'Dani', 'Emir', 'Fatima', 'Gio', 'Hana', 'Ivan', 'Jade', 'Kofi', 'Lena'];

export function startSimulation(battle, { seed = 7 } = {}) {
  let state = seed >>> 0 || 7;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (list) => list[Math.floor(random() * list.length)];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const pickGift = () => {
    let r = random() * GIFTS.reduce((sum, g) => sum + g.weight, 0);
    return GIFTS.find((g) => (r -= g.weight) < 0) ?? GIFTS[0];
  };

  const viewers = NAMES.map((name, i) => ({ id: `sim-${i}`, name, avatar: null, favorite: random() < 0.5 ? 'red' : 'blue' }));
  let group = 0;

  async function sendGift(user, gift) {
    const base = { user, giftId: gift.id, giftName: gift.name, diamondCount: gift.diamonds, streakable: gift.combo };
    if (!gift.combo) return battle.gift({ ...base, repeatCount: 1 });
    const groupId = String(++group);
    const taps = 1 + Math.floor(random() * random() * 14);
    for (let n = 1; n <= taps; n++) {
      battle.gift({ ...base, groupId, repeatCount: n, repeatEnd: false });
      await wait(110 + random() * 60);
    }
    battle.gift({ ...base, groupId, repeatCount: taps, repeatEnd: true }); // TikTok's "combo finished" event
  }

  (async () => {
    while (true) {
      await wait(350 + random() * 950);
      const user = pick(viewers);
      if (random() < 0.12) battle.join(user, user.favorite);
      else sendGift(user, pickGift()); // not awaited: gifts overlap like on a real LIVE
    }
  })();
}
