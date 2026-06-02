# Cluedo — Multiplayer Online Game

A fully playable, real-time multiplayer implementation of the classic Cluedo board game, built from scratch and deployed as both a web application and a cross-platform desktop app via Electron.

---

## Live Demo

> Deployed on Render — [add your link here once live]

---

## Features

- **Real-time multiplayer** — 2 to 6 players, synchronized across all clients via WebSocket
- **Full Cluedo board** — 25×25 grid with all 9 rooms, corridors, and spawn points
- **Dice-based movement** — roll 2d6 each turn, move step by step with directional controls (keyboard + D-pad)
- **Secret passages** — instant teleport between corner rooms (Kitchen ↔ Library, Lounge ↔ Conservatory)
- **Character selection** — choose one of 6 suspects before the match starts; unchosen characters are auto-assigned
- **Suggestion & disproof system** — structured multi-step flow: suggest in a room, other players are queried in order, first match disproves privately
- **Player summoning** — naming a suspect in a suggestion teleports that player's token to your room
- **Accusation & elimination** — correct accusation wins the match; wrong accusation eliminates the player
- **Detective's notebook** — track ruled-out, possible, and confirmed cards in-game
- **In-game chat** — real-time messaging with emoji picker
- **Audio system** — background music and per-action sound effects, with volume controls
- **Disconnect handling** — graceful recovery: host reassignment, auto-disproof if a player disconnects mid-response, card reveal on elimination
- **Authentication** — login / signup / access code recovery
- **Responsive UI** — playable on desktop and mobile with collapsible panels
- **Electron wrapper** — packaged as a standalone desktop app for Windows, macOS, and Linux

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, Vanilla JavaScript, Phaser 3 |
| Realtime | Socket.IO (WebSocket) |
| Backend | Node.js, Express |
| Desktop | Electron |
| Deployment | Render (web), Electron Builder (desktop) |

---

## Architecture

```
Browser / Electron
      │
      │  HTTP(S) + WebSocket
      ▼
┌─────────────────────────────────────┐
│           server/index.js           │
│  Express — serves static client     │
│  Socket.IO — event gateway          │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│           server/game.js            │
│  Rules engine — server-authoritative│
│  Turn management, suggestion/disproof│
│  Accusation, elimination, disconnect │
│  In-memory game state               │
└─────────────────────────────────────┘

Client (client/)
├── index.html + style.css  — Lobby, auth, modals, HUD
├── client.js               — Socket event handling, UI logic
└── gamescene.js            — Phaser 3 board scene, token rendering, movement
```

**Server-authoritative design:** all rule validation and state transitions happen on the server. Clients send intent (move, suggest, accuse) and render what the server confirms. This prevents desynchronization and cheating.

**Room-based isolation:** each match is bound to a Socket.IO room identified by a 4-character game code. Broadcasts never leak between matches.

**Pending state machine for suggestions:** the suggestion→disproof flow is tracked server-side as a structured pending object, preventing race conditions and enforcing private card reveals.

---

## Project Structure

```
00-Cluedo-multiplayer-game-online/
├── client/
│   ├── assets/
│   │   ├── audio/          — Sound effects and background music
│   │   └── ui/             — Room, suspect, and weapon card images
│   ├── index.html          — Single-page app shell
│   ├── client.js           — Socket.IO event handling and UI logic
│   ├── gamescene.js        — Phaser 3 board scene
│   └── style.css
└── server/
    ├── index.js            — Express server, REST auth endpoints
    ├── game.js             — Full game engine and socket logic
    └── package.json
```

---

## Running Locally

```bash
cd server
npm install
node index.js
```

Open `http://localhost:3000` in two or more browser tabs to test multiplayer locally.

---

## Key Design Decisions

**Single Node.js process** serves both the static client and the WebSocket API, keeping deployment simple — one port, one process.

**No framework on the frontend** — Vanilla JS for the lobby and game logic, Phaser 3 only for the board canvas. This keeps the bundle lightweight and debugging straightforward.

**In-memory state** — game sessions live in a JS object on the server. Fast, zero-config, appropriate for a stateless game where sessions are short-lived. A database would be the natural next step for persistence (match history, leaderboards).

**Electron as a thin wrapper** — the desktop app simply loads the live web URL in a BrowserWindow. No second codebase, no extra networking layer.

---

## Socket Event Reference

| Event (client → server) | Description |
|---|---|
| `create_game` | Create a new lobby |
| `join_game` | Join an existing lobby by code |
| `select_character` | Choose a suspect character |
| `start_game` | Host starts the match |
| `roll_dice` | Roll 2d6 to get movement points |
| `move_step` | Move one step in a direction |
| `use_secret_passage` | Teleport via corner room passage |
| `select_exit_door` | Choose exit door when multiple available |
| `make_suggestion` | Suggest suspect + weapon in current room |
| `disprove` | Show a matching card to the suggester |
| `make_accusation` | Final accusation — win or be eliminated |
| `end_turn` | End current turn |
| `chat_message` | Send a chat message |
| `leave_game` | Voluntarily leave the match |

---

## License

This project was developed as part of an integrator project at the University of Strasbourg.
