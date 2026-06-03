# Technical Design Document — Cluedo Online

**Version:** 1.0.4  
**Date:** 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack & Engineering Rationale](#2-technology-stack--engineering-rationale)
3. [System Architecture](#3-system-architecture)
4. [Server — Game Engine Deep Dive](#4-server--game-engine-deep-dive)
5. [Client — Frontend Architecture](#5-client--frontend-architecture)
6. [Core Game Flow](#6-core-game-flow)
7. [Suggestion & Disproof State Machine](#7-suggestion--disproof-state-machine)
8. [Board System & Movement Engine](#8-board-system--movement-engine)
9. [Disconnect Resilience & Edge Case Handling](#9-disconnect-resilience--edge-case-handling)
10. [Desktop Distribution via Electron](#10-desktop-distribution-via-electron)
11. [Known Limitations & Engineering Roadmap](#11-known-limitations--engineering-roadmap)
12. [Terminology](#12-terminology)

---

## 1. System Overview

Cluedo Online is a production-grade, full-stack real-time multiplayer game built on a server-authoritative architecture. The system manages up to 6 concurrent players per match, coordinating complex asynchronous game interactions — turn sequencing, private information exchange, multi-player disproof chains, and live board state — entirely through a custom-built Node.js game engine communicating over persistent WebSocket connections.

The final release (V1.0.4) represents a complete implementation spanning:
- A 25×25 interactive game board rendered via the Phaser 3 game framework
- A typed socket event protocol mapping directly to a finite state machine
- A server-side rules engine that is the single source of truth for all game state
- A responsive single-page application with audio, animations, and real-time chat
- A cross-platform Electron desktop distribution targeting Windows, macOS, and Linux

### Game Contents

| Category | Elements |
|---|---|
| Suspects | Miss Scarlett, Colonel Mustard, Mrs. White, Mr. Green, Mrs. Peacock, Professor Plum |
| Weapons | Candlestick, Knife, Lead Pipe, Revolver, Rope, Wrench |
| Rooms | Kitchen, Ballroom, Conservatory, Dining Room, Billiard Room, Library, Lounge, Hall, Study |

---

## 2. Technology Stack & Engineering Rationale

Every technology choice in this stack was made deliberately to solve a specific constraint. This section explains not just what was used, but why.

### Node.js — Game Engine Runtime

Node.js was chosen as the server runtime for several compounding reasons. Its event-driven, non-blocking I/O model is architecturally aligned with a real-time game server: incoming socket events are queued and processed without thread contention, and the single-threaded execution model eliminates entire classes of concurrency bugs that would appear in a multi-threaded environment. The V8 engine delivers sufficient throughput for a game server handling short bursts of events per turn. Crucially, sharing JavaScript across the full stack means the same data structures, constants (SUSPECTS, WEAPONS, ROOMS), and validation logic can be reasoned about uniformly without translation layers between server and client.

### Express 5 — HTTP Layer & Static Delivery

Express handles two distinct responsibilities: serving the compiled client bundle as static assets, and exposing a lightweight REST API for authentication. Collocating the HTTP server and the WebSocket server on a single port and process eliminates cross-origin complexity in production and simplifies deployment to a single dyno. Express 5's improved async error propagation also removes the need for manual try/catch wrappers around async route handlers.

### Socket.IO 4 — Real-Time Event Transport

Socket.IO was chosen over raw WebSockets for several architectural benefits. Its room abstraction maps directly to the game's isolation requirement: one game code equals one room, and `io.to(code).emit(...)` guarantees that broadcasts are scoped to exactly the players of a given match with zero additional filtering logic. Its built-in reconnection handling, fallback transports, and acknowledgement system provide resilience that would otherwise require significant custom implementation. The event-based API — `socket.on(event, handler)` — also serves as a natural protocol definition: each named event corresponds to a specific game action or state update, making the protocol self-documenting and easy to audit. Socket.IO's namespace and room architecture additionally scales cleanly to multi-server deployments via the Redis adapter, which represents a straightforward future upgrade path.

### Phaser 3 — Board Rendering Engine

Phaser 3 provides a WebGL/Canvas rendering pipeline with a structured scene lifecycle (boot → preload → create → update) that cleanly separates asset loading from scene construction and frame-by-frame updates. Its sprite and tile management system handles the 25×25 board grid, character token rendering, and movement animations with hardware acceleration, offloading rendering work to the GPU and keeping the main thread available for socket event processing. Phaser's input system allows mouse and keyboard events to be mapped to game actions without conflicting with the existing DOM-based UI. Critically, Phaser integrates into a standard HTML page without requiring a separate build pipeline or bundler — the scene initializes inside a `div` alongside conventional HTML/CSS elements, keeping the lobby, modals, and HUD in the DOM where they are easiest to style and manipulate.

### Vanilla JavaScript — UI Logic Layer

The lobby, authentication flow, game HUD, modals, notebook, and chat are implemented in plain JavaScript without a framework. This was a deliberate architectural decision: the UI state in this application is largely driven by socket events rather than local user interactions, which makes a reactive framework's diffing and component lifecycle machinery unnecessary overhead. Direct DOM manipulation in response to socket events is more transparent, easier to debug with browser devtools, and produces no framework-specific abstraction layers that could obscure timing issues in the real-time event flow.

### Electron — Cross-Platform Desktop Runtime

Electron wraps the web application in a native desktop shell using Chromium as the renderer and Node.js as the backend, producing distributable executables for Windows, macOS, and Linux from a single codebase. The key engineering decision was to implement Electron as a thin wrapper that loads the live production URL rather than bundling a local server — this means there is no separate client codebase to maintain, all users (web and desktop) are always on the same version, and the desktop app requires zero additional networking configuration. The main process implements an IPC bridge for session heartbeating and platform metadata, while the BrowserWindow is configured with context isolation and disabled node integration to maintain the security boundary between the renderer and the host OS.

---

## 3. System Architecture

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                  │
│  ┌────────────────────────────┐  ┌──────────────────────────┐   │
│  │      index.html            │  │      gamescene.js        │   │
│  │      style.css             │  │      Phaser 3 Scene      │   │
│  │                            │  │                          │   │
│  │  ├── View router           │  │  ├── Scene lifecycle     │   │
│  │  ├── Auth flow             │  │  ├── Tile grid renderer  │   │
│  │  ├── Lobby & char select   │  │  ├── Sprite token mgmt   │   │
│  │  ├── Game HUD              │  │  ├── Movement animation  │   │
│  │  ├── Modals (suggest/accuse│  │  └── Input forwarding    │   │
│  │  ├── Detective's notebook  │  └──────────┬───────────────┘   │
│  │  ├── Chat + emoji picker   │             │                    │
│  │  ├── Audio engine          │             │                    │
│  │  └── Settings panel        │             │                    │
│  └────────────┬───────────────┘             │                    │
│               └──────────────┬──────────────┘                   │
│                          client.js                              │
│               ├── Socket.IO event bus                           │
│               ├── UI state machine                              │
│               ├── Notebook state manager                        │
│               └── Action button orchestration                   │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                  HTTP(S) for assets + WSS for events
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                       TRANSPORT LAYER                            │
│                                                                  │
│   server/index.js                                               │
│   ├── Express 5                                                 │
│   │   ├── Static middleware → serves client/                    │
│   │   ├── POST /api/login                                       │
│   │   ├── POST /api/signup                                      │
│   │   └── POST /api/recover-code                               │
│   └── Socket.IO Server                                          │
│       ├── CORS wildcard (configurable for production)           │
│       └── Delegates all socket logic to game.js                │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                        GAME ENGINE                               │
│                                                                  │
│   server/game.js — createGameModule(io)                         │
│                                                                  │
│   ├── Match Registry     — Map<gameCode, GameState>             │
│   ├── Lifecycle Manager  — create · join · character · start    │
│   ├── Board Engine       — 25×25 grid · directional validation  │
│   │                         door constraints · occupancy checks │
│   ├── Turn Controller    — index tracking · advancement         │
│   │                         elimination skipping               │
│   ├── Suggestion FSM     — pending state · responder chain      │
│   │                         privacy enforcement · auto-resolve  │
│   ├── Accusation Handler — solution comparison · win/elim logic │
│   │                         card broadcast on elimination       │
│   └── Disconnect Handler — grace period · host reassignment     │
│                             turn correction · last-man-standing │
└──────────────────────────────────────────────────────────────────┘
```

### Architectural Invariants

**Single source of truth** — the `GameState` object on the server is the only authoritative representation of a match. No client holds canonical state; all client-side state is a derived view of server-emitted events.

**Strict validation before mutation** — every socket handler follows the pattern: validate inputs → validate permissions → validate game state → apply mutation → broadcast. A handler that fails any validation step returns an error event and leaves state unchanged.

**Private information via targeted emission** — Socket.IO's `io.to(socketId).emit(...)` is used for any event carrying private data (dealt cards, disproof prompts, revealed cards). Room-level broadcasts (`io.to(gameCode).emit(...)`) carry only public state. This architectural separation enforces information hiding at the transport layer.

---

## 4. Server — Game Engine Deep Dive

### 4.1 Game State Schema

```js
{
  players: [{
    id: string,          // socket.id — transport-level identity
    name: string,        // display name (max 16 chars)
    isHost: boolean,
    eliminated: boolean,
    pos: { row: number, col: number },   // current board position
    character: string,   // assigned suspect name
    inRoomName: string | null,           // current room, null if in corridor
    wasSummoned: boolean // true if teleported by a suggestion this turn
  }],
  started: boolean,
  gameOver: boolean,
  solution: {            // never emitted to clients
    suspect: string,
    weapon: string,
    room: string
  },
  hands: {               // private — each player only receives their own
    [socketId]: string[]
  },
  turnIndex: number,
  pending: {             // non-null during suggestion→disproof sequence
    suggesterId: string,
    suspect: string,
    weapon: string,
    room: string,
    responderIndex: number
  } | null,
  currentMoveLimit: number,   // remaining steps this turn
  hasRolledDice: boolean,
  hasMadeSuggestion: boolean,
  currentPath: { row, col }[] // visited cells this turn (backtrack prevention)
}
```

### 4.2 Match Initialization

When a host triggers `start_game`, the engine executes the following sequence atomically:

1. **Solution selection** — one suspect, one weapon, and one room are drawn at random using a Fisher-Yates–adjacent shuffle and stored in `game.solution`. This object is never serialized into any broadcast event.
2. **Deck assembly** — the remaining 17 cards (5 suspects + 5 weapons + 8 rooms) are shuffled.
3. **Round-robin deal** — cards are distributed by iterating `deck[i % playerCount]`, ensuring the most even possible distribution regardless of player count.
4. **Character assignment** — players who did not select a character receive one from the pool of unchosen suspects.
5. **Spawn placement** — each player is assigned a starting position by scanning the board for their labeled spawn cell (D1–D6).
6. **Private hand emission** — `io.to(p.id).emit("your_hand", { hand })` delivers each player's cards in isolation. No player can observe another's hand at the transport level.

### 4.3 Turn Controller

Turn management is handled by two cooperative functions:

`findNextActiveIndex(game, startIndex)` — iterates forward from a starting index, skipping eliminated players, and returns the index of the next eligible player. Handles full-loop edge cases where all but one player is eliminated.

`ensureTurnOnActivePlayer(game)` — called at the top of every action handler to reconcile `game.turnIndex` with the current eliminated state. This guards against edge cases where a player is eliminated between the turn update and their next action (e.g. eliminated by the previous player's accusation resolution).

`advanceTurn(code)` — resets all per-turn flags (`currentMoveLimit`, `hasRolledDice`, `hasMadeSuggestion`, `currentPath`), clears the `wasSummoned` flag on the current player, advances `turnIndex` via `findNextActiveIndex`, and emits `turn_update` to all players in the room.

### 4.4 Authentication API

The server exposes three REST endpoints backed by a JSON file store:

| Endpoint | Validation | Response |
|---|---|---|
| `POST /api/login` | Username lookup (case-insensitive normalization) + password comparison | `{ success, username }` |
| `POST /api/signup` | Required fields · email regex · password length ≥ 6 · letter+digit requirement · unique username | `{ success, username }` |
| `POST /api/recover-code` | Email lookup across all stored users | `{ success, username, code }` |

Usernames are normalized to lowercase as the storage key, preserving the display-case variant in the record. This allows `"Alice"` and `"alice"` to be treated as the same account while retaining the original casing for display.

> Security note: credentials are stored in plaintext in a JSON file, gitignored from the repository. This is appropriate for a closed demo environment. A production upgrade path would introduce bcrypt hashing, JWT session tokens, and a proper database backend.

---

## 5. Client — Frontend Architecture

### 5.1 Single-Page Application Structure

The entire client is a single HTML document containing all screens as `<section>` elements. Screen transitions are managed by `showView(viewId)`, which toggles CSS classes to show exactly one screen at a time. This approach avoids the complexity of a client-side router while providing instant, no-reload transitions between all application states.

### 5.2 Phaser 3 Integration

`gamescene.js` implements a Phaser 3 `Scene` class with the standard lifecycle:

- **Preload** — loads all board tile sprites, character token images, and room assets into the Phaser asset cache
- **Create** — constructs the 25×25 tile grid by iterating the board definition, instantiates player token sprites at their spawn positions, and registers input handlers
- **Update** — handles per-frame interpolation for smooth token movement animations

The scene deliberately has no direct socket dependency. All board updates (player positions, token visibility, room entry effects) are triggered by `client.js` calling public methods on the scene instance. This decouples the rendering logic from the network layer and makes the scene independently testable.

### 5.3 UI State Machine (`client.js`)

The client maintains a set of flags mirroring the authoritative server state:

```js
let currentGameCode = null;   // active match identifier
let amEliminated = false;     // local elimination status
let gameOver = false;         // match completion flag
let inGame = false;           // lobby vs game view flag
let hasMadeSuggestionThisTurn = false;
let latestPlayers = [];       // last received player roster
```

`setActionButtons({ myTurn, currentRoom })` is the central UI gate function, called on every `turn_update` event. It enables or disables the Roll Dice, End Turn, Secret Passage, Suggest, and Accuse controls based on the combined state of whose turn it is, whether the player is eliminated, and whether the game is over.

### 5.4 Detective's Notebook

The notebook is a persistent client-side state object (`notebookState`) mapping every card name to one of four states: `unknown`, `possible`, `impossible`, `confirmed`. It is automatically updated by three server events:

- **`your_hand`** — own cards are immediately marked `impossible` (they cannot be the solution)
- **`wrong_accusation_cards`** — eliminated player's cards are marked `impossible` and displayed in an alert
- **`player_disconnected_cards`** — disconnecting player's cards are marked `impossible`

The notebook UI cycles through states on click and persists across the lifetime of a match. On game start, `resetNotebookState()` clears all entries to ensure no state bleeds from a previous match.

### 5.5 Audio Engine

Eight WAV sound effects are mapped to game events:

| Sound | Trigger |
|---|---|
| `dice-roll.wav` | `dice_rolled` |
| `move-step.wav` | `player_moved` (corridor) |
| `room-entry.wav` | `player_moved` (room entry) |
| `suggestion.wav` | `suggestion_made` |
| `card-reveal.wav` | `card_revealed` / `someone_disproved` |
| `turn-change.wav` | `turn_update` |
| `accusation.wav` | `game_won` / `player_eliminated` |
| `theme.wav` | Background music loop |

Audio is instantiated via the Web Audio API through `new Audio(src)` per event, keeping playback decoupled from the Phaser audio context. Volume and mute state are managed through the settings panel and persisted in the session.

---

## 6. Core Game Flow

```
Account creation / Login
          │
Create game ──────────────── Join game (by code)
          │                           │
          └──────────┬────────────────┘
                     │
          Character selection screen
          (real-time taken/available sync)
                     │
          Host clicks Start Game
                     │
          Server: draw solution · deal cards · assign spawns
                     │
          All clients: receive private hand · switch to board view
                     │
                     ▼
     ┌───────────────────────────────────────────────────┐
     │                    TURN LOOP                      │
     │                                                   │
     │  Active player:                                   │
     │  1. Roll dice (2d6) → receive move budget         │
     │     OR use secret passage (if in corner room)     │
     │                                                   │
     │  2. Move step by step (D-pad / keyboard)          │
     │     · Each step validated server-side             │
     │     · Backtrack prevention via currentPath        │
     │     · Room entry snaps to seat, ends movement     │
     │                                                   │
     │  3. If in a room → may make a Suggestion          │
     │     (see §7 — Suggestion FSM)                     │
     │                                                   │
     │  4. May make an Accusation at any point           │
     │     · Correct → game_won emitted to all           │
     │     · Incorrect → player eliminated               │
     │       · Cards broadcast to all                    │
     │       · Check if last player standing             │
     │                                                   │
     │  5. End Turn → advance to next active player      │
     └───────────────────────────────────────────────────┘
                     │
          Win condition met
                     │
          Result modal: winner + solution revealed
```

### End Conditions

| Situation | Outcome |
|---|---|
| Correct accusation | Immediate win; full solution revealed to all players |
| All but one player eliminated | Last remaining player wins by default |
| Player disconnects mid-game | Game continues; their cards are revealed and ruled out in all notebooks |

---

## 7. Suggestion & Disproof State Machine

The suggestion→disproof interaction is the most architecturally complex feature of the system. It is inherently multi-player, asynchronous, and involves strict private information boundaries — a card revealed to the suggester must never be visible to other players at the transport level.

### State Diagram

```
[idle]
  │
  │ make_suggestion received
  ▼
[validate]
  ├── not player's turn → reject
  ├── dice not rolled → reject
  ├── not in a room → reject
  ├── room mismatch → reject
  ├── pending already exists → reject
  └── pass → continue
  │
  ▼
[pending set]
  pending = { suggesterId, suspect, weapon, room, responderIndex: turnIndex+1 }
  Emit suggestion_made → all (public)
  Optionally: summon named suspect to current room
  │
  ▼
[askNextResponder loop]
  For each player after the suggester (circular, in turn order):
    │
    ├── player is suggester → break (full loop, no disproof possible)
    │     Emit no_one_disproved → all
    │     Clear pending → [idle]
    │
    ├── player has no matching card → continue to next
    │
    └── player has matching card(s):
          Set pending.responderIndex = this player's index
          Emit you_must_disprove → this player only (private)
          Emit waiting_for_disprove → all (public)
          → [awaiting_disprove]
  │
  ▼
[awaiting_disprove]
  │ disprove received
  ├── not the current responder → reject
  ├── card not in hand → reject
  ├── card does not match suggestion → reject
  └── pass → continue
  │
  ▼
[resolve]
  Emit card_revealed → suggester only (private)
  Emit someone_disproved → all (public, card not included)
  Clear pending → [idle]
```

### Privacy Model

Three distinct emission targets enforce information boundaries:

- `io.to(gameCode)` — public events (suggestion made, waiting, someone disproved, no one disproved)
- `io.to(suggesterId)` — card revealed (only the suggester sees the actual card)
- `io.to(responderId)` — disproof prompt (only the responder sees the matching card options)

This model guarantees that no player can observe another player's private hand through the network layer, even if they intercept all socket traffic on the public room channel.

### Player Summoning

When a suggestion names a suspect whose token is on the board, the server:
1. Locates the player whose `character` matches the suspect name
2. Assigns them a predefined seat position inside the current room from `ROOM_SEATS`
3. Sets `wasSummoned = true`
4. Emits `player_moved` to all players with the new position

On the summoned player's next turn, `wasSummoned` bypasses the dice roll requirement, allowing them to make a suggestion immediately without rolling. The flag is cleared on `advanceTurn`.

---

## 8. Board System & Movement Engine

### Grid Definition

The board is defined as a 25-row × 25-column matrix of typed cell values in `game.js`:

| Cell Value | Type | Description |
|---|---|---|
| `0` | Wall | Impassable — edge cells and structural walls |
| `1` | Corridor | Standard walkable cell |
| `2` | Room interior | Visual room tile — not directly enterable; accessed via door cells |
| `'D1'–'D6'` | Spawn | Player starting positions |
| `'C', 'G1'–'G4'` etc. | Door | Room entrance/exit cells with directional constraints |

### Movement Validation — `getValidDirections`

For each of the four cardinal directions (z/s/q/d), the engine checks:

1. **Bounds check** — target cell exists within the 25×25 grid
2. **Passability** — target cell is not `0` (wall) or `2` (room interior)
3. **Door directionality** — certain door cells enforce entry direction. For example, the Library entrance (`'O'`) can only be entered moving south, and can only be exited moving north. This models the physical orientation of doorways on the board.
4. **Backtrack prevention** — `game.currentPath` records every cell visited this turn. A cell already in the path cannot be re-entered, preventing oscillation and artificial stalling.
5. **Occupancy** — a cell currently occupied by another non-eliminated player cannot be entered.

### Room Entry

When a player steps onto a door cell (any cell value that is a string not starting with `'D'`):
- `game.currentMoveLimit` is set to 0 (movement ends immediately)
- The player's position is snapped to a predefined seat coordinate from `ROOM_SEATS[roomName][playerIndex]`
- `player.inRoomName` is set to the room name
- `player_moved` is broadcast with `inRoom: true`

This snap-to-seat system ensures tokens are visually positioned inside the room rather than on the doorway tile, and that multiple players in the same room occupy distinct positions.

### Room Exit

When a player rolls dice while `inRoomName` is set:
1. The engine evaluates all doors for that room from `ROOM_DOORS`
2. For each door, it temporarily places the player on the door cell and checks `getValidDirections` to determine if the door is blocked
3. If zero doors are unblocked → movement is forfeited, `hasRolledDice` is set
4. If exactly one door is unblocked → the player is automatically placed on that door cell
5. If multiple doors are unblocked → `ask_exit_door` is emitted to the player, who selects their preferred exit

### Secret Passages

| Room | Connected Room |
|---|---|
| Kitchen | Library |
| Library | Kitchen |
| Lounge | Conservatory |
| Conservatory | Lounge |

Secret passages are modeled in the `SECRET_PASSAGES` lookup. Using a passage:
- Sets `hasRolledDice = true` and `currentMoveLimit = 0` (counts as full movement)
- Snaps the player to a seat inside the destination room
- Sets `inRoomName` to the destination
- Broadcasts `player_moved` with `inRoom: true`

---

## 9. Disconnect Resilience & Edge Case Handling

Player disconnections in a real-time multiplayer game can occur at any point in the game flow — mid-turn, mid-suggestion, or between turns. The engine handles all cases explicitly.

### Grace Period

On `disconnect`, the engine waits 4 seconds before executing cleanup. This absorbs accidental page refreshes and brief network interruptions without disrupting the match.

### `removePlayerFromGames` — Cleanup Logic

```
1. Locate player in match registry by socket.id

2. Determine context:
   a. Was this player the current disproof responder?
   b. Was this player the suggester?
   c. Was it their turn?
   d. Were they the host?

3. If (a) — auto-disprove:
   Select a random matching card from the disconnecting player's hand
   Schedule emission of card_revealed → suggester after turn_update
   (ordering matters: card_revealed must arrive after turn_update
    so the client re-enables the End Turn button correctly)
   Cancel pending state

4. If (b) — cancel pending state

5. Splice player from players array
   Force socket.leave(gameCode) to prevent ghost broadcasts

6. Broadcast player_disconnected_cards → remaining players
   (triggers notebook update on all clients)

7. If (d) — reassign host to players[0]

8. If 0 players remain — delete match from registry

9. If 1 active player remains — emit game_won (last man standing)

10. Correct turnIndex:
    If it was their turn → reset move state, re-run ensureTurnOnActivePlayer
    If they were before the current turn → decrement turnIndex

11. Emit lobby_update + turn_update to remaining players
12. Emit pending auto-disprove events (after turn_update, see step 3)
```

The deliberate ordering of step 12 — emitting `card_revealed` after `turn_update` — is a non-obvious timing fix. If `card_revealed` arrives before `turn_update`, the client re-enables the End Turn button, but `turn_update` then immediately disables it again (since `setActionButtons` resets all controls). By emitting in the correct order, the final state of the button is correctly enabled.

---

## 10. Desktop Distribution via Electron

### Architecture

The Electron application consists of three layers:

**Main process (`electron/main.js`)** — manages the application lifecycle, creates the `BrowserWindow`, and sets window properties (dimensions, menu bar visibility). The window loads the live production URL directly, making the desktop app a thin native shell around the web deployment.

**Bridge module (`electron/bridge.js`)** — implements the IPC layer between the main process and the renderer:
- Session state management (client ID generation, heartbeat tracking)
- `bridge:ping` handler — responds with server status and timestamp
- `bridge:config` handler — exposes platform metadata (OS, architecture, Electron version)
- `bridge:log` handler — conditional debug logging gated by `ELECTRON_DEBUG` environment variable
- Security header injection via `session.webRequest.onHeadersReceived`

**Preload script** — runs in the renderer context with access to Node.js APIs before the web page loads, providing a controlled bridge between the web content and the Electron runtime.

### Distribution Strategy

By pointing the desktop app at the live server rather than bundling a local server, the distribution model gains several advantages:
- Desktop users always run the latest version automatically
- No server startup time or port conflict management
- Binary size remains minimal (no bundled Node.js server or game assets)
- A single deployment covers all clients simultaneously

Build targets are configured via Electron Builder: NSIS installer for Windows, DMG for macOS, AppImage for Linux.

---

## 11. Known Limitations & Engineering Roadmap

| Area | Current Implementation | Planned Improvement |
|---|---|---|
| State persistence | In-memory only; all match state is lost on server restart | Redis-backed session store with Socket.IO Redis adapter for persistence and horizontal scaling |
| Authentication | Plaintext JSON file store | Bcrypt password hashing, JWT session tokens, PostgreSQL user store |
| Movement UX | Step-by-step D-pad with move budget | A* pathfinding with click-to-destination targeting |
| Scalability | Single-process Node.js | Socket.IO Redis adapter enabling multi-instance deployment behind a load balancer |
| Security hardening | Basic input validation | Rate limiting per socket, stricter payload schema validation, HTTPS enforcement |
| Board pathfinding | Manual directional constraints per door | Generalized graph-based movement model derived from board definition |

---

## 12. Terminology

| Term | Definition |
|---|---|
| **Suggestion** | A claim (suspect + weapon + room) made from within a room, initiating the disproof chain |
| **Disproof** | Privately showing one matching card to the suggesting player to refute their suggestion |
| **Accusation** | A final definitive claim compared against the hidden solution — correct wins the game, incorrect eliminates the player |
| **Elimination** | Status of a player after a wrong accusation; they remain in the match as an observer but cannot take actions |
| **Summoning** | Teleportation of a suspect's token to the suggesting player's room when that suspect is named in a suggestion |
| **Pending state** | Server-side object representing an in-progress suggestion awaiting disproof resolution |
| **Secret passage** | A direct room-to-room connection between two corner rooms, usable in lieu of dice movement |
| **Server-authoritative** | Architectural pattern where the server is the sole source of truth for game state; clients only render and request |
| **Room isolation** | Socket.IO room scoping that confines all match broadcasts to the players of a single game |
