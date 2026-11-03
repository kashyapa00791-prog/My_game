# Sansad Arena 3D

An original, stylized 3D arena-fighting starter project. It is inspired by the broad genre of browser fighting games, not a copy of FightKaro's code, characters, art, branding, or private systems.

## Features
- Three.js 3D arena and original placeholder fighters built from geometry
- CPU opponent
- Health bars, guard, strike, dash and touch controls
- Online two-player room codes using WebSocket
- Mobile browser support; landscape is recommended

## Run on Android with Termux
1. Install Termux from a trusted source and open it.
2. Run:
   ```sh
   pkg update -y
   pkg install nodejs-lts unzip -y
   ```
3. Extract this ZIP into a folder, then `cd` into `SansadArena3D`.
4. Install dependencies and start:
   ```sh
   npm install
   npm start
   ```
5. Open `http://127.0.0.1:8080` in your phone browser.

## Online play
Both players need to open the same publicly reachable server URL and enter the same room code. For internet play, deploy the Node app to a Node.js host with WebSocket support, or use a secure tunnel for temporary testing. The server uses the same HTTP port for WebSocket upgrades.

## Notes / current prototype limits
- This is a runnable starter, not a production-grade competitive fighting engine.
- Online state sync is intentionally simple and not authoritative; do not expose it as a ranked/secure game.
- No official FightKaro assets or source code are included.
- Replace placeholder geometry with original character models, animation clips, sound, and original stage art as the project grows.
