import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';
import { Battle, sideFromComment } from './public/battle.js';
import { startSimulation } from './public/simulator.js';

// npm start -- your_username [--round=120] [--break=15] [--port=3000] [--simulate]
const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const TIKTOK_USERNAME = (process.env.TIKTOK_USERNAME || args.find((a) => !a.startsWith('--')) || '').replace('@', '');
const SIMULATE = Boolean(process.env.SIMULATE) || args.includes('--simulate');
const PORT = Number(flag('port') || process.env.PORT) || 3000;

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const app = express();
app.use(express.static(here('./public')));
app.use('/vendor/three', express.static(here('./node_modules/three')));
app.use('/vendor/fonts', express.static(here('./node_modules/@fontsource')));
const http = createServer(app);
const io = new Server(http);

const battle = new Battle({
  roundSeconds: Number(flag('round') || process.env.ROUND_SECONDS) || 120,
  breakSeconds: Number(flag('break') || process.env.BREAK_SECONDS) || 15,
  emit: (event, data) => io.emit(event, data),
});
setInterval(() => battle.tick(), 200);
io.on('connection', (socket) => socket.emit('state', battle.snapshot()));

// TikTok user -> the small viewer object the game uses
function viewer(user) {
  return {
    id: user?.id || user?.displayId || 'anonymous',
    name: user?.nickname || user?.displayId || 'Anonymous',
    avatar: user?.avatarThumb?.urlList?.[0] ?? null,
  };
}

function connectToTikTok() {
  const tiktok = new TikTokLiveConnection(TIKTOK_USERNAME, {});

  tiktok.on(WebcastEvent.CHAT, (data) => {
    const side = sideFromComment(data.content);
    if (side) battle.join(viewer(data.user), side);
  });

  tiktok.on(WebcastEvent.GIFT, (data) => {
    battle.gift({
      user: viewer(data.user),
      giftId: data.giftId,
      giftName: data.gift?.name ?? 'Gift',
      diamondCount: data.gift?.diamondCount ?? 1,
      repeatCount: data.repeatCount,
      repeatEnd: Boolean(data.repeatEnd),
      streakable: data.gift?.type === 1,
      groupId: data.groupId,
    });
  });

  // Reconnect if TikTok drops the connection or you restart your LIVE
  let retry;
  const reconnectLater = (reason) => {
    console.log(`Not connected to TikTok (${reason}). Retrying in 10s...`);
    clearTimeout(retry);
    retry = setTimeout(connect, 10_000);
  };
  tiktok.on(ControlEvent.DISCONNECTED, () => reconnectLater('the connection dropped'));
  tiktok.on(WebcastEvent.STREAM_END, () => reconnectLater('the LIVE ended'));

  function connect() {
    tiktok.connect()
      .then((state) => console.log(`Connected to @${TIKTOK_USERNAME}'s LIVE (room ${state.roomId})`))
      .catch((err) => reconnectLater(`${err.message} Is @${TIKTOK_USERNAME} LIVE right now?`));
  }
  connect();
}

if (SIMULATE) {
  console.log('Simulation mode: fake viewers are sending gifts');
  startSimulation(battle);
} else if (TIKTOK_USERNAME) {
  connectToTikTok();
} else {
  console.log('No TikTok username given. Run: npm start -- your_tiktok_username   (or npm run simulate)');
}

http.listen(PORT, () => console.log(`Game running at http://localhost:${PORT}`));
