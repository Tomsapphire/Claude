# Robot Gift Battle 🔥🤖❄️

A 3D robot fight for TikTok LIVE. Two robots, **BLAZE** (red) and **FROST** (blue), fight on a floating neon arena.
Viewers pick a side in the chat, and every gift they send makes their robot attack. When the timer runs out,
the robot with the most gift power wins and knocks the loser off the arena and down off the screen.

## How the game works

- Viewers comment **`1`** (or `red` / `blaze`) to join BLAZE, **`2`** (or `blue` / `frost`) to join FROST.
- Every gift counts by its **diamond value** (a Rose is 1 💎, a Galaxy is 1,000 💎).
  Viewers who gift without picking a side join whichever robot is losing.
- Bigger gifts make bigger attacks:

  | Gift value | Attack |
  |---|---|
  | 1 – 19 💎 | quick jab |
  | 20 – 249 💎 | heavy punch |
  | 250 – 999 💎 | jumping **SMASH!** with a shockwave |
  | 1,000+ 💎 | **SUPER!** power-up and energy blast |

- The power bar at the top shows who's ahead, and the fight drifts toward the robot that's losing.
- The final 10 seconds show a big countdown. Then it's **K.O.!**: the winner lands a final punch, the loser
  flies off the arena and falls off the screen, and the winner dances while the screen shows the winner and the MVP (top gifter).
- After a short break the loser drops back in and the next round starts. Gifts sent during the break count toward the next fight.

## Setup (once)

1. Install [Node.js](https://nodejs.org) (the LTS version).
2. In this folder, run:
   ```bash
   npm install
   ```

## Try it without going live

```bash
npm run simulate
```
Open <http://localhost:3000>. Fake viewers join teams and send gifts through the same code real gifts use.

You can also open <http://localhost:3000/?demo> while the server is running, with or without `--simulate`.
That page runs its own fake round entirely in the browser.

## Use it on your LIVE

1. Start your TikTok LIVE.
2. Run (with your own username):
   ```bash
   npm start -- your_tiktok_username
   ```
   It reconnects automatically if TikTok drops the connection.
3. Add the game to your stream as a **browser source** with the URL `http://localhost:3000` at **1080 × 1920**:
   - **OBS:** Sources → + → Browser, then tick "Control audio via OBS" to get the sound effects.
   - **TikTok LIVE Studio:** add the page as a web/link source if your version has one. Otherwise open it in a
     browser window and capture that window.

### Options

Server (after `npm start --`):

| Option | Default | What it does |
|---|---|---|
| `--round=120` | 120 | Fight length in seconds |
| `--break=15` | 15 | Break between fights in seconds |
| `--port=3000` | 3000 | Web port |
| `--simulate` | off | Fake viewers instead of TikTok |

Page (add to the URL, e.g. `http://localhost:3000/?fps=30&quality=low`):

| Option | What it does |
|---|---|
| `?fps=30` | Caps the frame rate, which saves GPU while you stream |
| `?quality=low` | No glow or shadows, for slower PCs |
| `?sound=0` | Mutes the sound effects |
| `?demo` | Fake round in the browser (`&round=45&break=15&seed=7` to tweak it) |

## Customize

- Fighter names, icons and chat commands: `FIGHTERS` in `public/battle.js`
- Which gift values trigger which attack: `attackKind()` in `public/fighter.js`
- Team colors: `COLORS` in `public/arena.js` (and the CSS variables in `public/index.html`)
- Sounds: `public/sfx.js` (synthesized, no audio files)

## Files

| File | What it does |
|---|---|
| `server.js` | Connects to TikTok LIVE and forwards chat and gifts to the game |
| `public/battle.js` | Game rules: teams, scores, combos, rounds (shared by the server and the demo) |
| `public/simulator.js` | Fake viewers for testing |
| `public/game.js` | 3D scene, camera, combat choreography, K.O. sequence |
| `public/fighter.js` | A robot: animations, attacks, hit reactions, falling |
| `public/arena.js` | The floating arena, sky, lights and clouds |
| `public/effects.js` | Sparks, shockwaves, energy blasts, confetti |
| `public/hud.js` | Score bar, timer, gift feed, callouts, winner card |

## Good to know

- TikTok has no official API for LIVE gifts. This uses the unofficial
  [TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector) library, which can break when
  TikTok changes things. If connecting fails often, the library may ask for an API key from Euler Stream,
  the service it uses to connect.
- Don't promise money or prizes in exchange for gifts. TikTok's LIVE rules can treat that as gambling.
- Combo gifts (tapping a Rose many times) are counted per tap as they happen, never twice.

## Credits

- Robot model: [RobotExpressive](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive)
  by Tomás Laulhé, modifications by Don McCurdy, **CC0** (public domain).
- 3D engine: [three.js](https://threejs.org) (MIT). Fonts: Bungee and Rubik (SIL Open Font License).
