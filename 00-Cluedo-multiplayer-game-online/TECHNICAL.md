# Technical Design Document — Cluedo Online

**Version:** 1.0.4  
**Date:** 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack & Rationale](#2-technology-stack--rationale)
3. [Architecture](#3-architecture)
4. [Server — Game Engine](#4-server--game-engine)
5. [Client — Frontend](#5-client--frontend)
6. [Core Game Flow](#6-core-game-flow)
7. [Suggestion & Disproof State Machine](#7-suggestion--disproof-state-machine)
8. [Board System](#8-board-system)
9. [Disconnect Resilience](#9-disconnect-resilience)
10. [Desktop Distribution](#10-desktop-distribution)
11. [Known Limitations & Future Work](#11-known-limitations--future-work)
12. [Terminology](#12-terminology)

---

## 1. System Overview

Cluedo Online is a real-time multiplayer implementation of the Cluedo board game supporting 2 to 6 concurrent players. The system follows a **server-authoritative architecture** where all rule validation, state transitions, and game logic execute on the server. Clients are responsible only for rendering and forwarding player intent.

The final version (V1.0.4) delivers:
- A fully interactive 25×25 Cluedo board rendered with Phaser 3
- Complete Cluedo ruleset: movement, suggestion, disproof, accusation, elimination
- Real-time synchronization across all clients via Socket.IO WebSockets
- Character selection, player summoning, secret passages
- In-game chat, detective's notebook, audio system
- User authentication (login / signup / recovery)
- Electron packaging for desktop distribution

---

## 2. Technology Stack & Rationale

### Backend
| Technology | Role | Rationale |
|---|---|---|
| Node.js | Runtime | Single language across stack; event-driven model suits real-time game logic |
| Express | HTTP server | Serves static client files from the same process; minimal overhead |
| Socket.IO | WebSocket layer | Persistent bidirectional connections; built-in room support for match isolation; handles reconnection and fallback |
| In-memory state | Game session store | Zero-config, sufficient for short-lived game sessions; no schema to maintain while rules evolve |

### Frontend
| Technology | Role | Rationale |
|---|---|---|
| HTML5 + Vanilla JS | Lobby, auth, UI | No build pipeline required; fast iteration; full control |
| Phaser 3 | Board rendering | Lightweight canvas game framework; integrates cleanly with a standard web app; supports sprites, animations, and input |
| Socket.IO Client | Realtime | Mirrors the server API; handles reconnection transparently |

### Desktop
| Technology | Role | Rationale |
|---|---|---|
| Electron | Desktop wrapper | Reuses the existing web client unchanged; targets Windows, macOS, Linux from one codebase |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Client (client/)                       │
│                                                          │
│  ┌─────────────────────┐   ┌──────────────────────────┐  │
│  │  index.html         │   │  gamescene.js            │  │
│  │  style.css          │   │  Phaser 3 Board Scene    │  │
│  │  Lobby + Auth + HUD │   │  Tokens + Movement + Input│  │
│  └──────────┬──────────┘   └─────────────┬────────────┘  │
│             └──────────────┬─────────────┘               │
│                       client.js                          │
│                  Socket.IO event bus                     │
└────────────────────────────┬─────────────────────────────┘
                             │ WebSocket / HTTP
┌────────────────────────────▼─────────────────────────────┐
│                    server/index.js                        │
│         Express — static files + REST auth endpoints     │
│         Socket.IO Server — event gateway                  │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│                    server/game.js                         │
│                                                          │
│  createGameModule(io)                                    │
│  ├── Match lifecycle (create / join / start)             │
│  ├── Board & movement engine                             │
│  ├── Turn management                                     │
│  ├── Suggestion → disproof state machine                 │
│  ├── Accusation & elimination                            │
│  └── Disconnect handling                                 │
│                                                          │
│  In-memory store: Map<gameCode, GameState>               │
└──────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

**A — Server-authoritative state**  
No game rule is enforced by the client. Every action (move, suggest, accuse) is validated server-side before any state change is applied or broadcast. The client cannot spoof a valid move or skip validation.

**B — Event-driven communication**  
Gameplay is modeled as named socket events (`roll_dice`, `move_step`, `make_suggestion`, etc.), which map directly to game state transitions. This avoids polling and keeps client/server coupling explicit.

**C — Room-based match isolation**  
Each match occupies a dedicated Socket.IO room identified by a 4-character alphanumeric code. All broadcasts are scoped to that room; no cross-game data leakage is possible by design.

**D — Pending state for multi-step interactions**  
The suggestion→disproof sequence is asynchronous and involves multiple players. A server-side `pending` object tracks the in-progress suggestion and the current responder index, preventing race conditions and ensuring only one player disproves at a time.

---

## 4. Server — Game Engine

### 4.1 Game State Object

Each active match is stored as a plain JS object:

```js
{
  players: [{
    id,           // socket.id
    name,
    isHost,
    eliminated,
    pos: { row, col },
    character,
    inRoomName,
    wasSummoned
  }],
  started,
  gameOver,
  solution: { suspect, weapon, room },   // hidden from clients
  hands: { [socketId]: [cards] },        // private per player
  turnIndex,
  pending: {
    suggesterId,
    suspect, weapon, room,
    responderIndex
  },
  currentMoveLimit,
  hasRolledDice,
  hasMadeSuggestion,
  currentPath: [{ row, col }]
}
```

### 4.2 Match Lifecycle

1. `create_game` — generates a unique 4-char code, creates the game object, assigns the creator as host
2. `join_game` — validates game exists, not started, not full (max 6), no duplicate name
3. `select_character` — reserves a suspect for the player; others see it as taken in real time
4. `start_game` — host-only: picks a random solution, deals remaining cards round-robin, assigns spawn positions from D1–D6 on the board, emits private hands

### 4.3 Turn Management

`advanceTurn` resets movement state and increments `turnIndex` to the next non-eliminated player. `ensureTurnOnActivePlayer` is called before every action validation to handle cases where the current player was eliminated between calls.

### 4.4 REST Authentication Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/login` | POST | Validate credentials against `users.json` |
| `/api/signup` | POST | Register new user with email + password validation |
| `/api/recover-code` | POST | Return credentials for a given email |

> Note: `users.json` is gitignored. Credentials are stored in plaintext — this is prototype-grade auth, suitable for a closed demo environment. Production hardening would require password hashing and a proper database.

---

## 5. Client — Frontend

### 5.1 Views (Single Page)

The UI is a single HTML page with multiple `section` elements toggled via `showView()`. No router is used.

| View | Purpose |
|---|---|
| `view-home` | Landing screen |
| `view-auth` | Login / Signup |
| `view-game-mode` | Create or join |
| `view-create-game` | Generate game code |
| `view-join-game` | Enter game code |
| `view-character-selection` | Choose suspect |
| `view-game` | Active gameplay |

### 5.2 Phaser Board Scene (`gamescene.js`)

Renders the 25×25 board on a canvas element. Responsibilities:
- Render board tiles (corridors, rooms, walls)
- Display player tokens with character sprites
- Animate movement steps
- Show room entry and secret passage effects

The scene is driven entirely by server events forwarded from `client.js`. It does not emit socket events itself.

### 5.3 Socket Event Handling (`client.js`)

All socket events are handled here. Key flows:
- `your_hand` → transition to game view, render hand cards
- `turn_update` → enable/disable action buttons based on whose turn it is
- `dice_rolled` → update movement counter, enable D-pad directional buttons
- `player_moved` → forward position to Phaser scene, update move counter
- `you_must_disprove` → show private card choice modal
- `card_revealed` → show private alert to the suggesting player
- `game_won` / `accusation_wrong` → show result modal

### 5.4 Detective's Notebook

Client-side state machine tracking each card as `unknown`, `possible`, `impossible`, or `confirmed`. Automatically marks cards as impossible when:
- The player receives their hand (their own cards cannot be the solution)
- A player is eliminated and their cards are revealed
- A player disconnects mid-game

---

## 6. Core Game Flow

```
create/join lobby
       │
character selection
       │
host starts match
       │
cards dealt privately ──► each player receives their hand
       │
       ▼
┌─────────────────────────────────────────────┐
│                TURN LOOP                    │
│                                             │
│  1. Active player rolls dice                │
│  2. Player moves step by step               │
│     (or uses secret passage)                │
│  3. If in a room: may make a suggestion     │
│     └── disproof flow (see §7)              │
│  4. May make an accusation at any point     │
│     ├── Correct → match ends, winner        │
│     └── Wrong   → player eliminated         │
│  5. Player ends turn                        │
│  6. Next non-eliminated player's turn       │
└─────────────────────────────────────────────┘
       │
last player standing / correct accusation
       │
result modal shown to all players
```

---

## 7. Suggestion & Disproof State Machine

This is the most complex interaction in the game, involving multiple players asynchronously with private information.

```
Suggester emits make_suggestion
          │
          ▼
Server validates: correct turn, in a room, dice rolled, room matches position
          │
          ▼
Server sets pending = { suggesterId, suspect, weapon, room, responderIndex }
          │
          ▼
Server emits suggestion_made → all players (public)
          │
          ▼
askNextResponder():
  for each player after suggester (in turn order):
    if player has a matching card:
      emit you_must_disprove → that player (private)
      emit waiting_for_disprove → all players
      return (wait for disprove event)
    else:
      continue to next player
  if no one can disprove:
    emit no_one_disproved → all players
    clear pending
          │
          ▼ (on disprove event from responder)
Server validates card belongs to responder and matches suggestion
emit card_revealed → suggester only (private)
emit someone_disproved → all players (anonymous — "a card was shown")
clear pending
```

Player summoning: when a suggestion names a suspect, the server teleports that suspect's token to a seat inside the current room, and sets `wasSummoned = true` on that player, allowing them to make a suggestion on their next turn without rolling dice.

---

## 8. Board System

The board is a 25×25 grid defined in `game.js` as a 2D array with cell types:

| Value | Meaning |
|---|---|
| `0` | Wall / inaccessible |
| `1` | Corridor (walkable) |
| `2` | Room interior (non-walkable, visual only) |
| `'D1'–'D6'` | Player spawn points |
| `'C', 'G1-G4', etc.` | Room door/entrance cells |

Movement validation (`getValidDirections`) checks:
- Target cell is valid (not wall, not room interior)
- Direction-specific door constraints (e.g. Library door only entered from the south)
- No backtracking on the current path (prevents oscillation)
- No cell occupied by another active player

Room entry snaps the player to a predefined seat position inside the room and sets `inRoomName`, consuming all remaining movement points.

**Secret passages** connect the four corner rooms:
- Kitchen ↔ Library
- Lounge ↔ Conservatory

Using a secret passage counts as the player's movement for the turn and places them directly inside the destination room.

---

## 9. Disconnect Resilience

On `disconnect`, a 4-second grace period allows for accidental disconnections. After the timeout, `removePlayerFromGames` executes:

1. If the leaving player was the **current responder** in a pending disproof, a card is auto-selected randomly from their matching cards and revealed to the suggester — the game does not stall
2. If the leaving player was the **suggester**, the pending state is cancelled
3. Host is reassigned to the next player if needed
4. Turn index is corrected if it was the leaving player's turn
5. If only one active player remains, that player wins automatically
6. Disconnected player's cards are broadcast to remaining players (marked as ruled out in their notebooks)

---

## 10. Desktop Distribution

The Electron application (`electron/main.js`) is a thin wrapper that opens a `BrowserWindow` pointed at the live server URL. No local server is bundled into the desktop app — it connects to the same backend as the web version.

This approach:
- Eliminates the need to maintain two separate client codebases
- Keeps the binary lightweight
- Ensures all clients (web and desktop) are always on the same version

Build targets: Windows (NSIS installer), macOS (DMG), Linux (AppImage).

---

## 11. Known Limitations & Future Work

| Area | Current State | Potential Improvement |
|---|---|---|
| Persistence | In-memory only; state lost on server restart | Redis or a lightweight DB for session recovery |
| Authentication | Plaintext passwords in a JSON file | Bcrypt hashing, JWT sessions |
| Board pathfinding | No pathfinding — step-by-step with remaining move count | A* pathfinding with click-to-move |
| Scalability | Single Node.js process | Socket.IO Redis adapter for horizontal scaling |
| Security | No rate limiting, no input sanitization beyond type checks | Express rate-limiter, stricter validation |

---

## 12. Terminology

| Term | Definition |
|---|---|
| **Suggestion** | A claim (suspect + weapon + room) made while in a room, triggering the disproof procedure |
| **Disproof** | Privately showing one matching card to the suggesting player |
| **Accusation** | A final claim compared against the hidden solution — correct wins, wrong eliminates |
| **Elimination** | A player who made a wrong accusation; they remain in the match as an observer but cannot act |
| **Summoning** | When a suggestion names a suspect, that player's token is teleported to the suggesting player's room |
| **Pending state** | Server-side object tracking an in-progress suggestion awaiting disproof |
| **Secret passage** | A direct connection between two corner rooms usable instead of rolling dice |
