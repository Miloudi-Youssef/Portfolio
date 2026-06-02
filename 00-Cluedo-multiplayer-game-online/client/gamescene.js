// client/gameScene.js

let phaserGame;

const GRID_SIZE = 25;
const CANVAS_SIZE = 750;

const OFFSET_X = 2;
const OFFSET_Y = -2;
const VISUAL_CELL_SIZE = 30.0;

const DEBUG_POINTER = false;

const PAWN_STEP_DURATION = 280;
const AUTO_PATH_NEXT_STEP_DELAY = PAWN_STEP_DURATION + 30;

// Couleurs officielles du Cluedo
const CHARACTER_COLORS = {
  Scarlet: 0xff0000,
  Mustard: 0xffff00,
  White: 0xffffff,
  Green: 0x00ff00,
  Peacock: 0x00d1ff,
  Plum: 0x800080
};

// Portraits utilisés sur le board
const CHARACTER_PORTRAITS = {
  Scarlet: "portrait_scarlet",
  Mustard: "portrait_mustard",
  White: "portrait_white",
  Green: "portrait_green",
  Peacock: "portrait_peacock",
  Plum: "portrait_plum"
};

// Couleurs par défaut si la partie n'a pas encore commencé
const FALLBACK_COLORS = [0xff0000, 0xffff00, 0xffffff, 0x00ff00, 0x00d1ff, 0x800080];

// Déplacements clavier / pathfinding front
const MOVE_DELTAS = {
  z: { dr: -1, dc: 0 },
  s: { dr: 1, dc: 0 },
  q: { dr: 0, dc: -1 },
  d: { dr: 0, dc: 1 }
};

const CLUEDO_BOARD = [
  [2, 2, 2, 2, 2, 2, 0, 0, 0, "D5", 2, 2, 2, 2, 2, "D6", 0, 0, 0, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 0, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, "P", 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, "G1", 2, 2, 2, 2, 2, 2, 2, "G4", 1, 1, 1, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, "C", 1, 1, 2, "G2", 2, 2, 2, 2, 2, "G3", 2, 1, 1, 1, 1, 1, 1, 1, "D1"],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, "E2", 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, "E1", 2],
  [2, 2, 2, 2, 2, 2, 2, "S1", 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, "B2", 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, "S2", 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, "B1", 2, 2, 2, 2, 2, 2, 2],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2],
  ["D4", 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, "H1", "H2", "H3", 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, "D2"],
  [2, 2, 2, 2, 2, 2, "V", 1, 1, 2, 2, 2, 2, 2, 2, "H4", 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, "O", 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, "D3", 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 2, 2, 2, 2, 2, 2, 2]
];

const ROOM_MAP = {
  C: "Kitchen",
  G1: "Ballroom",
  G2: "Ballroom",
  G3: "Ballroom",
  G4: "Ballroom",
  V: "Conservatory",
  S1: "Dining Room",
  S2: "Dining Room",
  B1: "Billiard Room",
  B2: "Billiard Room",
  O: "Library",
  P: "Lounge",
  H1: "Hall",
  H2: "Hall",
  H3: "Hall",
  H4: "Hall",
  E1: "Study",
  E2: "Study"
};

const ROOM_DOORS = {
  Lounge: [{ row: 4, col: 20, label: "P" }],
  Kitchen: [{ row: 6, col: 5, label: "C" }],
  Conservatory: [{ row: 19, col: 6, label: "V" }],
  Library: [{ row: 20, col: 18, label: "O" }],
  Ballroom: [
    { row: 5, col: 8, label: "G1" },
    { row: 6, col: 9, label: "G2" },
    { row: 6, col: 15, label: "G3" },
    { row: 5, col: 16, label: "G4" }
  ],
  "Dining Room": [
    { row: 12, col: 7, label: "S1" },
    { row: 15, col: 6, label: "S2" }
  ],
  "Billiard Room": [
    { row: 15, col: 17, label: "B1" },
    { row: 13, col: 21, label: "B2" }
  ],
  Hall: [
    { row: 18, col: 11, label: "H1" },
    { row: 18, col: 12, label: "H2" },
    { row: 18, col: 13, label: "H3" },
    { row: 19, col: 15, label: "H4" }
  ],
  Study: [
    { row: 11, col: 23, label: "E1" },
    { row: 9, col: 18, label: "E2" }
  ]
};

// Sièges internes des pièces
const ROOM_SEATS = {
  Lounge: [
    { row: 1, col: 21 }, { row: 1, col: 22 }, { row: 1, col: 23 },
    { row: 2, col: 21 }, { row: 2, col: 22 }, { row: 2, col: 23 }
  ],
  Kitchen: [
    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
    { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }
  ],
  Conservatory: [
    { row: 21, col: 2 }, { row: 21, col: 3 }, { row: 21, col: 4 },
    { row: 22, col: 2 }, { row: 22, col: 3 }, { row: 22, col: 4 }
  ],
  Library: [
    { row: 21, col: 20 }, { row: 21, col: 21 }, { row: 21, col: 22 },
    { row: 22, col: 20 }, { row: 22, col: 21 }, { row: 22, col: 22 }
  ],
  Ballroom: [
    { row: 2, col: 11 }, { row: 2, col: 12 }, { row: 2, col: 13 },
    { row: 3, col: 11 }, { row: 3, col: 12 }, { row: 3, col: 13 }
  ],
  "Dining Room": [
    { row: 11, col: 2 }, { row: 11, col: 3 }, { row: 11, col: 4 },
    { row: 12, col: 2 }, { row: 12, col: 3 }, { row: 12, col: 4 }
  ],
  "Billiard Room": [
    { row: 15, col: 19 }, { row: 15, col: 20 }, { row: 15, col: 21 },
    { row: 16, col: 19 }, { row: 16, col: 20 }, { row: 16, col: 21 }
  ],
  Hall: [
    { row: 21, col: 10 }, { row: 21, col: 11 }, { row: 21, col: 12 },
    { row: 22, col: 10 }, { row: 22, col: 11 }, { row: 22, col: 12 }
  ],
  Study: [
    { row: 9, col: 20 }, { row: 9, col: 21 }, { row: 9, col: 22 },
    { row: 10, col: 20 }, { row: 10, col: 21 }, { row: 10, col: 22 }
  ]
};

// Règles d'entrée / sortie de portes côté front
const DOOR_ENTRY_DIRECTION = {
  O: "s",
  V: "q",
  C: "q"
};

const DOOR_EXIT_DIRECTION = {
  O: "z",
  V: "d",
  C: "d",
  H1: "z",
  H2: "z",
  H3: "z"
};

window.addEventListener("load", () => {
  if (phaserGame) return;

  const config = {
    type: Phaser.AUTO,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: "#0f0f0f",
    parent: "board",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: { preload, create }
  };

  phaserGame = new Phaser.Game(config);

const boardEl = document.getElementById("board");

if (boardEl) {
  function squareBoardContainer() {
    const size = Math.round(boardEl.getBoundingClientRect().width);

    if (size > 0 && boardEl.style.height !== size + "px") {
      boardEl.style.height = size + "px";
    }
  }

  const boardResizeObserver = new ResizeObserver(() => {
    if (!phaserGame) return;

    squareBoardContainer();
    phaserGame.scale.refresh();
  });

  boardResizeObserver.observe(boardEl);

  const boardVisibilityObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && phaserGame) {
      squareBoardContainer();
      phaserGame.scale.refresh();
    }
  });

  boardVisibilityObserver.observe(boardEl);

  squareBoardContainer();
}

  function preload() {
    this.load.image("board", "assets/board.png");

    this.load.image("portrait_plum", "assets/ui/suspects/plum.png");
    this.load.image("portrait_scarlet", "assets/ui/suspects/scarlet.png");
    this.load.image("portrait_mustard", "assets/ui/suspects/mustard.png");
    this.load.image("portrait_white", "assets/ui/suspects/white.png");
    this.load.image("portrait_peacock", "assets/ui/suspects/peacock.png");
    this.load.image("portrait_green", "assets/ui/suspects/green.png");
  }

  function create() {
    const scene = this;
    const socket = window.socket;

    if (!socket) {
      console.warn("window.socket introuvable. Vérifie l’ordre des scripts dans le HTML.");
      return;
    }

    scene.input.setDefaultCursor("default");

    let playersState = [];
    let activeTopBanner = null;
    let lastTurnPlayerId = null;
    let currentTurnPlayerId = null;

    let myTurn = false;
    let myHasRolledDice = false;
    let myRemainingMoves = 0;
    let myRoomName = null;
    let myPathHistory = [];
    let pendingDoorLabels = null;
    let pendingPathQueue = [];
    let pendingPathTargetKey = null;
    let interactionMarkers = [];
    let gameIsOver = false;

    let cachedReachableTargets = new Map();
    let isAutoMoving = false;

    createDiceTextures(scene);

    const boardImg = scene.add.image(CANVAS_SIZE / 2, CANVAS_SIZE / 2, "board");
    boardImg.setDisplaySize(CANVAS_SIZE, CANVAS_SIZE);
    boardImg.setDepth(0);

    drawGridOverlay(scene);

    const tokens = new Map();

    const toPixel = (col, row) => ({
      x: OFFSET_X + (col * VISUAL_CELL_SIZE) + (VISUAL_CELL_SIZE / 2),
      y: OFFSET_Y + (row * VISUAL_CELL_SIZE) + (VISUAL_CELL_SIZE / 2)
    });

    const toCellTopLeft = (col, row) => ({
      x: OFFSET_X + (col * VISUAL_CELL_SIZE),
      y: OFFSET_Y + (row * VISUAL_CELL_SIZE)
    });

    const keyForPos = (row, col) => `${row},${col}`;

    if (DEBUG_POINTER) {
      const pointerDebug = scene.add.circle(0, 0, 3, 0xff0000, 1)
        .setDepth(999)
        .setVisible(false);

      scene.input.on("pointermove", (pointer) => {
        pointerDebug.setVisible(true);
        pointerDebug.setPosition(pointer.worldX, pointer.worldY);
      });
    }

    function getGameCode() {
      const fromPanel = document.getElementById("codeInput")?.value?.trim()?.toUpperCase();
      const fromSetup = document.getElementById("setupCodeInput")?.value?.trim()?.toUpperCase();
      return fromPanel || fromSetup || "";
    }

    function setStatusLine(message) {
      const el = document.getElementById("gameStatus");
      if (el && typeof message === "string") {
        el.textContent = message;
      }
    }

    function clearPendingAutoPath() {
      pendingPathQueue = [];
      pendingPathTargetKey = null;
    }

    function getMePlayer() {
      return playersState.find((p) => p.id === socket.id) || null;
    }

    function getPlayerById(id) {
      return playersState.find((p) => p.id === id) || null;
    }

    function getPlayerName(id) {
      const p = getPlayerById(id);
      return p ? p.name : "Unknown";
    }

    function getCharacterPortrait(character) {
      return CHARACTER_PORTRAITS[character] || "portrait_scarlet";
    }

    function getTokenColor(player, idx) {
      return player.character && CHARACTER_COLORS[player.character]
        ? CHARACTER_COLORS[player.character]
        : FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
    }

    function getBoardCell(row, col) {
      if (row < 0 || row >= CLUEDO_BOARD.length || col < 0 || col >= CLUEDO_BOARD[0].length) return null;
      return CLUEDO_BOARD[row][col];
    }

    function isValidTile(col, row) {
      const tile = getBoardCell(row, col);
      return tile === 1 || typeof tile === "string";
    }

    function isRoomDoor(tile) {
      return typeof tile === "string" && !tile.startsWith("D");
    }

    function getRoomNameFromSeat(row, col) {
      for (const [roomName, seats] of Object.entries(ROOM_SEATS)) {
        if (seats.some((seat) => seat.row === row && seat.col === col)) {
          return roomName;
        }
      }
      return null;
    }

    function getRoomNameFromPosition(pos) {
      if (!pos) return null;
      const tile = getBoardCell(pos.row, pos.col);
      if (ROOM_MAP[tile]) return ROOM_MAP[tile];
      return getRoomNameFromSeat(pos.row, pos.col);
    }

    function isOccupied(col, row, exceptId) {
      return playersState.some((player) => (
        !player.eliminated &&
        player.id !== exceptId &&
        player.pos &&
        player.pos.col === col &&
        player.pos.row === row
      ));
    }

    function respectsDoorRules(currentCell, targetCell, direction) {
      if (DOOR_ENTRY_DIRECTION[targetCell] && DOOR_ENTRY_DIRECTION[targetCell] !== direction) {
        return false;
      }

      if (DOOR_EXIT_DIRECTION[currentCell] && DOOR_EXIT_DIRECTION[currentCell] !== direction) {
        return false;
      }

      return true;
    }

    function canStepFrom(row, col, direction, options = {}) {
      const delta = MOVE_DELTAS[direction];
      if (!delta) return null;

      const nextRow = row + delta.dr;
      const nextCol = col + delta.dc;

      if (!isValidTile(nextCol, nextRow)) return null;

      const blockedKeys = options.blockedKeys || null;
      const nextKey = keyForPos(nextRow, nextCol);
      if (blockedKeys && blockedKeys.has(nextKey)) return null;

      if (isOccupied(nextCol, nextRow, options.exceptId || null)) return null;

      const currentCell = getBoardCell(row, col);
      const targetCell = getBoardCell(nextRow, nextCol);

      if (!respectsDoorRules(currentCell, targetCell, direction)) return null;

      return {
        row: nextRow,
        col: nextCol,
        cell: targetCell
      };
    }

    function getBlockedKeysForCurrentTurn() {
      const blocked = new Set((myPathHistory || []).map((step) => keyForPos(step.row, step.col)));
      const me = getMePlayer();

      if (me?.pos) {
        blocked.delete(keyForPos(me.pos.row, me.pos.col));
      }

      return blocked;
    }

    function computeReachableTargets(player, moveBudget) {
      const results = new Map();
      if (!player?.pos || moveBudget <= 0) return results;

      const blockedKeys = getBlockedKeysForCurrentTurn();
      const startKey = keyForPos(player.pos.row, player.pos.col);
      const queue = [{ row: player.pos.row, col: player.pos.col, pathDirs: [] }];
      const visited = new Set([startKey]);

      while (queue.length) {
        const node = queue.shift();
        if (node.pathDirs.length >= moveBudget) continue;

        for (const direction of Object.keys(MOVE_DELTAS)) {
          const next = canStepFrom(node.row, node.col, direction, {
            exceptId: player.id,
            blockedKeys
          });

          if (!next) continue;

          const nextKey = keyForPos(next.row, next.col);
          if (visited.has(nextKey)) continue;

          const pathDirs = [...node.pathDirs, direction];
          const endsInRoom = isRoomDoor(next.cell);

          results.set(nextKey, {
            row: next.row,
            col: next.col,
            pathDirs,
            endsInRoom,
            steps: pathDirs.length
          });

          visited.add(nextKey);

          if (!endsInRoom && pathDirs.length < moveBudget) {
            queue.push({
              row: next.row,
              col: next.col,
              pathDirs
            });
          }
        }
      }

      return results;
    }

    function getUsableDoors(roomName, playerId) {
      const doors = ROOM_DOORS[roomName] || [];
      return doors.filter((door) => {
        for (const direction of Object.keys(MOVE_DELTAS)) {
          const next = canStepFrom(door.row, door.col, direction, {
            exceptId: playerId,
            blockedKeys: new Set()
          });
          if (next) return true;
        }
        return false;
      });
    }

    function recomputeReachableTargets() {
      cachedReachableTargets = new Map();

      const me = getMePlayer();
      if (!me || !me.pos) return;
      if (!myTurn || gameIsOver) return;
      if (myRemainingMoves <= 0) return;
      if (isAutoMoving) return;

      cachedReachableTargets = computeReachableTargets(me, myRemainingMoves);
    }

    function setTokenPosition(obj, x, y) {
      obj.sprite.setPosition(x, y);

      if (obj.shadow) {
        obj.shadow.setPosition(x, y + VISUAL_CELL_SIZE * 0.4);
      }

      obj.label.setPosition(x, y - VISUAL_CELL_SIZE * 1.2);

      if (obj.highlightRing) {
        obj.highlightRing.setPosition(x, y);
      }
    }

    function getMoveDistance(oldPos, newPos) {
      if (!oldPos || !newPos) return 0;
      return Math.abs(oldPos.col - newPos.col) + Math.abs(oldPos.row - newPos.row);
    }

    function resetTokenVisualState(obj) {
      if (!obj) return;

      scene.tweens.killTweensOf(obj.sprite);
      scene.tweens.killTweensOf(obj.label);

      if (obj.shadow) scene.tweens.killTweensOf(obj.shadow);
      if (obj.highlightRing) scene.tweens.killTweensOf(obj.highlightRing);

      obj.sprite.setAlpha(1);
      obj.sprite.setScale(obj.baseScaleX, obj.baseScaleY);
      obj.label.setAlpha(1);

      if (obj.shadow) obj.shadow.setAlpha(0.6);
      if (obj.highlightRing) obj.highlightRing.setAlpha(0.18);
    }

    function playBoardFlash(color = 0xffffff, alpha = 0.35, duration = 260, depth = 90) {
      const flash = scene.add.rectangle(
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2,
        CANVAS_SIZE,
        CANVAS_SIZE,
        color,
        alpha
      ).setDepth(depth);

      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration,
        onComplete: () => flash.destroy()
      });
    }

    function playArrivalPulse(x, y, color = 0xd4af37, maxRadius = 28, depth = 18) {
      const ring = scene.add.circle(x, y, 8, color, 0.45).setDepth(depth);

      scene.tweens.add({
        targets: ring,
        radius: maxRadius,
        alpha: 0,
        duration: 280,
        ease: "Sine.easeOut",
        onComplete: () => ring.destroy()
      });
    }

    function playGroundGlow(x, y, color = 0xd4af37, radius = VISUAL_CELL_SIZE * 0.95, depth = 17) {
      const glow = scene.add.circle(x, y, radius, color, 0.18).setDepth(depth);

      scene.tweens.add({
        targets: glow,
        scale: 1.5,
        alpha: 0,
        duration: 280,
        ease: "Sine.easeOut",
        onComplete: () => glow.destroy()
      });
    }

    function pulseToken(obj, scaleBoost = 1.12, duration = 120) {
      scene.tweens.add({
        targets: obj.sprite,
        scaleX: obj.baseScaleX * scaleBoost,
        scaleY: obj.baseScaleY * 0.95,
        duration,
        yoyo: true,
        ease: "Sine.easeInOut",
        onComplete: () => {
          if (obj.sprite && obj.sprite.active) {
            obj.sprite.setScale(obj.baseScaleX, obj.baseScaleY);
          }
        }
      });
    }

    function clearTurnHighlights() {
      for (const [, obj] of tokens.entries()) {
        if (obj.highlightRing) {
          obj.highlightRing.destroy();
          obj.highlightRing = null;
        }
      }
    }

    function highlightCurrentPlayer(playerId) {
      clearTurnHighlights();

      if (!tokens.has(playerId)) return;

      const obj = tokens.get(playerId);

      const ring = scene.add.circle(
        obj.sprite.x,
        obj.sprite.y,
        VISUAL_CELL_SIZE * 0.72,
        0xd4af37,
        0.18
      ).setDepth(18);

      obj.highlightRing = ring;

      scene.tweens.add({
        targets: ring,
        scale: 1.28,
        alpha: 0.05,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });

      playArrivalPulse(obj.sprite.x, obj.sprite.y, 0xd4af37, 34, 19);
      pulseToken(obj, 1.08, 110);
    }

    function destroyActiveTopBanner() {
      if (!activeTopBanner) return;
      activeTopBanner.bg?.destroy();
      activeTopBanner.txt?.destroy();
      activeTopBanner = null;
    }

    function playTopBanner(textValue, options = {}) {
      const startY = -48;
      const endY = 42;
      const bgColor = options.bgColor ?? 0x14100d;
      const textColor = options.textColor ?? "#f2eee9";
      const hold = options.hold ?? 1800;

      destroyActiveTopBanner();

      const bg = scene.add.rectangle(
        CANVAS_SIZE / 2,
        startY,
        CANVAS_SIZE,
        66,
        bgColor,
        0.95
      ).setDepth(140);

      const txt = scene.add.text(
        CANVAS_SIZE / 2,
        startY,
        textValue,
        {
          fontFamily: "'Cinzel', serif",
          fontSize: "24px",
          fontWeight: "bold",
          color: textColor,
          stroke: "#000000",
          strokeThickness: 3
        }
      ).setOrigin(0.5).setDepth(141);

      activeTopBanner = { bg, txt };

      scene.tweens.add({
        targets: [bg, txt],
        y: endY,
        duration: 460,
        ease: "Back.easeOut",
        onComplete: () => {
          scene.time.delayedCall(hold, () => {
            scene.tweens.add({
              targets: [bg, txt],
              y: startY,
              alpha: 0,
              duration: 360,
              onComplete: () => {
                bg.destroy();
                txt.destroy();

                if (activeTopBanner && activeTopBanner.bg === bg) {
                  activeTopBanner = null;
                }
              }
            });
          });
        }
      });
    }

    function playEventBanner(textValue, color = 0x2c1d12, hold = 1600) {
      playTopBanner(textValue, { bgColor: color, hold });
    }

    function playTurnBanner(playerId) {
      const playerName = getPlayerName(playerId);

      if (playerId === socket.id) {
        playTopBanner("YOUR TURN", {
          bgColor: 0x14100d,
          hold: 2200
        });
      } else {
        playTopBanner(`${playerName.toUpperCase()}'S TURN`, {
          bgColor: 0x1d1d1d,
          hold: 1400
        });
      }
    }

    function playCenterNotice(title, subtitle, options = {}) {
      const overlay = scene.add.rectangle(
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2,
        CANVAS_SIZE,
        CANVAS_SIZE,
        0x000000,
        options.overlayAlpha ?? 0.25
      ).setDepth(options.depth ?? 95);

      const panel = scene.add.rectangle(
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2,
        options.width ?? 420,
        options.height ?? 160,
        options.panelColor ?? 0x14100d,
        0.95
      ).setStrokeStyle(2, options.accentColor ?? 0xd4af37).setDepth((options.depth ?? 95) + 1);

      const titleText = scene.add.text(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 28, title, {
        fontFamily: "'Cinzel', serif",
        fontSize: options.titleSize ?? "28px",
        fontWeight: "bold",
        color: options.titleColor ?? "#f2eee9",
        align: "center"
      }).setOrigin(0.5).setDepth((options.depth ?? 95) + 2);

      const subText = scene.add.text(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20, subtitle, {
        fontFamily: "'Inter', sans-serif",
        fontSize: options.subtitleSize ?? "17px",
        color: options.subtitleColor ?? "#f2eee9",
        align: "center",
        wordWrap: { width: (options.width ?? 420) - 50 }
      }).setOrigin(0.5).setDepth((options.depth ?? 95) + 2);

      panel.setScale(0.82);
      titleText.setScale(0.82);
      subText.setScale(0.82);
      overlay.setAlpha(0);
      panel.setAlpha(0);
      titleText.setAlpha(0);
      subText.setAlpha(0);

      scene.tweens.add({
        targets: overlay,
        alpha: options.overlayAlpha ?? 0.25,
        duration: 140
      });

      scene.tweens.add({
        targets: [panel, titleText, subText],
        alpha: 1,
        scale: 1,
        duration: 250,
        ease: "Back.easeOut"
      });

      scene.time.delayedCall(options.hold ?? 1200, () => {
        scene.tweens.add({
          targets: [overlay, panel, titleText, subText],
          alpha: 0,
          y: "-=8",
          duration: 220,
          onComplete: () => {
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            subText.destroy();
          }
        });
      });
    }

    function playSpawnAnimation(obj) {
      obj.sprite.setScale(obj.baseScaleX * 0.25, obj.baseScaleY * 0.25);
      obj.sprite.setAlpha(0);

      if (obj.shadow) obj.shadow.setAlpha(0);
      obj.label.setAlpha(0);

      scene.tweens.add({
        targets: obj.sprite,
        scaleX: obj.baseScaleX,
        scaleY: obj.baseScaleY,
        alpha: 1,
        duration: 360,
        ease: "Back.easeOut"
      });

      if (obj.shadow) {
        scene.tweens.add({
          targets: obj.shadow,
          alpha: 0.6,
          duration: 260,
          delay: 100
        });
      }

      scene.tweens.add({
        targets: obj.label,
        alpha: 1,
        duration: 260,
        delay: 120
      });

      playArrivalPulse(obj.sprite.x, obj.sprite.y, obj.color);
      playGroundGlow(obj.sprite.x, obj.sprite.y, obj.color);
    }

    function animateTokenMove(obj, x, y, duration = PAWN_STEP_DURATION) {
      resetTokenVisualState(obj);

      scene.tweens.add({
        targets: obj.sprite,
        x,
        y,
        duration,
        ease: "Sine.easeOut",
        onStart: () => {
          obj.sprite.setScale(obj.baseScaleX * 1.08, obj.baseScaleY * 0.92);
        },
        onComplete: () => {
          obj.sprite.setScale(obj.baseScaleX, obj.baseScaleY);
          playArrivalPulse(x, y, obj.color);
        }
      });

      if (obj.shadow) {
        scene.tweens.add({
          targets: obj.shadow,
          x,
          y: y + VISUAL_CELL_SIZE * 0.4,
          duration,
          ease: "Sine.easeOut"
        });
      }

      scene.tweens.add({
        targets: obj.label,
        x,
        y: y - VISUAL_CELL_SIZE * 1.2,
        duration,
        ease: "Sine.easeOut"
      });

      if (obj.highlightRing) {
        scene.tweens.add({
          targets: obj.highlightRing,
          x,
          y,
          duration,
          ease: "Sine.easeOut"
        });
      }
    }

    function animateTeleport(obj, x, y, options = {}) {
      resetTokenVisualState(obj);

      const spriteAndLabel = [obj.sprite, obj.label];
      const extras = [];

      if (obj.shadow) extras.push(obj.shadow);
      if (obj.highlightRing) extras.push(obj.highlightRing);

      const flashColor = options.flashColor ?? 0xffffff;
      const pulseColor = options.pulseColor ?? flashColor;

      scene.tweens.add({
        targets: [...spriteAndLabel, ...extras],
        alpha: 0,
        duration: 120,
        onComplete: () => {
          setTokenPosition(obj, x, y);

          obj.sprite.setAlpha(0);
          obj.label.setAlpha(0);
          if (obj.shadow) obj.shadow.setAlpha(0);
          if (obj.highlightRing) obj.highlightRing.setAlpha(0);

          scene.tweens.add({
            targets: obj.sprite,
            alpha: 1,
            duration: 180
          });

          scene.tweens.add({
            targets: obj.label,
            alpha: 1,
            duration: 180
          });

          if (obj.shadow) {
            scene.tweens.add({
              targets: obj.shadow,
              alpha: 0.6,
              duration: 180
            });
          }

          if (obj.highlightRing) {
            scene.tweens.add({
              targets: obj.highlightRing,
              alpha: 0.18,
              duration: 180
            });
          }

          playArrivalPulse(x, y, pulseColor, 34);
          playGroundGlow(x, y, flashColor, VISUAL_CELL_SIZE * 1.2);
        }
      });
    }

    function animateRoomEntry(obj, x, y, playerId) {
      scene.cameras.main.shake(110, 0.0015);
      playBoardFlash(0xd4af37, 0.12, 160, 75);

      animateTeleport(obj, x, y, {
        flashColor: 0xd4af37,
        pulseColor: 0xf5d36b
      });

      playCenterNotice("ROOM ENTERED", `${getPlayerName(playerId)} entered a room.`, {
        width: 390,
        height: 120,
        hold: 800,
        accentColor: 0xd4af37,
        overlayAlpha: 0.12,
        panelColor: 0x1c140d,
        depth: 92
      });
    }

    function animateSummonTeleport(obj, x, y) {
      playEventBanner(`${obj.label.text.toUpperCase()} WAS SUMMONED`, 0x3d174f, 1300);
      playBoardFlash(0xb86cff, 0.12, 180, 76);

      const oldX = obj.sprite.x;
      const oldY = obj.sprite.y;

      const summonMark = scene.add.circle(oldX, oldY, 18, 0xb86cff, 0.22).setDepth(21);
      scene.tweens.add({
        targets: summonMark,
        scale: 2.2,
        alpha: 0,
        duration: 360,
        onComplete: () => summonMark.destroy()
      });

      animateTeleport(obj, x, y, {
        flashColor: 0xb86cff,
        pulseColor: 0xd9a8ff
      });

      scene.cameras.main.shake(130, 0.0021);
    }

    function playCardReveal(cardText, fromName) {
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2;

      const card = scene.add.rectangle(
        cx,
        cy,
        250,
        140,
        0xffffff,
        0.94
      ).setStrokeStyle(2, 0x000000).setDepth(100);

      const text = scene.add.text(cx, cy - 6, cardText, {
        fontFamily: "'Cinzel', serif",
        fontSize: "24px",
        color: "#000000",
        align: "center",
        wordWrap: { width: 220 }
      }).setOrigin(0.5).setDepth(101);

      const subtitle = scene.add.text(cx, cy + 96, `${fromName} showed you a card`, {
        fontFamily: "'Inter', sans-serif",
        fontSize: "16px",
        color: "#f2eee9",
        backgroundColor: "rgba(20,16,13,0.85)",
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setDepth(101);

      card.setScale(0.7);
      text.setScale(0.7);
      subtitle.setAlpha(0);

      scene.tweens.add({
        targets: [card, text],
        scale: 1,
        duration: 260,
        ease: "Back.easeOut"
      });

      scene.tweens.add({
        targets: subtitle,
        alpha: 1,
        duration: 220,
        delay: 180
      });

      scene.time.delayedCall(1750, () => {
        scene.tweens.add({
          targets: [card, text, subtitle],
          alpha: 0,
          y: "-=10",
          duration: 260,
          onComplete: () => {
            card.destroy();
            text.destroy();
            subtitle.destroy();
          }
        });
      });
    }

    function playSuggestionAnnouncement(byPlayerId, suspect, weapon, room) {
      const suggesterName = getPlayerName(byPlayerId);

      playEventBanner("SUGGESTION", 0x3a2416, 1400);

      playCenterNotice(
        "SUGGESTION",
        `${suggesterName}\n${suspect} / ${weapon} / ${room}`,
        {
          width: 430,
          height: 180,
          hold: 1450,
          accentColor: 0xb88a5a,
          overlayAlpha: 0.16,
          panelColor: 0x21160f,
          titleColor: "#f4ddb6",
          subtitleColor: "#f2eee9",
          depth: 94
        }
      );
    }

    function playWrongAccusationEffect(message = "Wrong accusation!") {
      playBoardFlash(0xff4040, 0.22, 240, 96);
      scene.cameras.main.shake(160, 0.003);

      playCenterNotice("WRONG ACCUSATION", message, {
        width: 470,
        height: 170,
        hold: 1500,
        accentColor: 0xff4040,
        overlayAlpha: 0.28,
        panelColor: 0x2a1010,
        titleColor: "#ff9b9b",
        subtitleColor: "#f2eee9",
        depth: 97
      });
    }

    function playVictoryEffect(obj) {
      const flash = scene.add.rectangle(
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2,
        CANVAS_SIZE,
        CANVAS_SIZE,
        0xffffff,
        0.85
      ).setDepth(110);

      scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 520,
        onComplete: () => flash.destroy()
      });

      const halo = scene.add.circle(
        obj.sprite.x,
        obj.sprite.y,
        VISUAL_CELL_SIZE * 0.9,
        0xd4af37,
        0.30
      ).setDepth(109);

      scene.tweens.add({
        targets: halo,
        scale: 1.8,
        alpha: 0,
        duration: 1000,
        onComplete: () => halo.destroy()
      });

      for (let i = 0; i < 14; i++) {
        const spark = scene.add.circle(
          obj.sprite.x,
          obj.sprite.y,
          3 + Math.random() * 3,
          0xd4af37,
          0.9
        ).setDepth(111);

        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 40;

        scene.tweens.add({
          targets: spark,
          x: obj.sprite.x + Math.cos(angle) * dist,
          y: obj.sprite.y + Math.sin(angle) * dist,
          alpha: 0,
          duration: 500 + Math.random() * 350,
          onComplete: () => spark.destroy()
        });
      }
    }

    function playEliminationEffect(obj) {
      const fadeTargets = [obj.sprite, obj.label];
      if (obj.shadow) fadeTargets.push(obj.shadow);
      if (obj.highlightRing) fadeTargets.push(obj.highlightRing);

      scene.tweens.add({
        targets: obj.sprite,
        angle: 360,
        duration: 600
      });

      scene.tweens.add({
        targets: fadeTargets,
        alpha: 0,
        duration: 600
      });
    }

    function createDiceTextures(sceneRef) {
      for (let n = 1; n <= 6; n++) {
        const key = `dice_face_${n}`;
        if (sceneRef.textures.exists(key)) continue;
        drawDieTexture(sceneRef, key, n);
      }
    }

    function drawDieTexture(sceneRef, key, value) {
      const size = 96;
      const pipR = 7;

      const positions = {
        tl: [24, 24],
        tc: [48, 24],
        tr: [72, 24],
        ml: [24, 48],
        mc: [48, 48],
        mr: [72, 48],
        bl: [24, 72],
        bc: [48, 72],
        br: [72, 72]
      };

      const faces = {
        1: ["mc"],
        2: ["tl", "br"],
        3: ["tl", "mc", "br"],
        4: ["tl", "tr", "bl", "br"],
        5: ["tl", "tr", "mc", "bl", "br"],
        6: ["tl", "tr", "ml", "mr", "bl", "br"]
      };

      const g = sceneRef.make.graphics({ x: 0, y: 0, add: false });

      g.fillStyle(0xf5f1e8, 1);
      g.lineStyle(5, 0x1b1b1b, 1);
      g.fillRoundedRect(0, 0, size, size, 18);
      g.strokeRoundedRect(0, 0, size, size, 18);

      g.fillStyle(0x111111, 1);
      faces[value].forEach((slot) => {
        const [x, y] = positions[slot];
        g.fillCircle(x, y, pipR);
      });

      g.generateTexture(key, size, size);
      g.destroy();
    }

    function makeDicePairFromTotal(total) {
      const pairs = [];

      for (let a = 1; a <= 6; a++) {
        for (let b = 1; b <= 6; b++) {
          if (a + b === total) {
            pairs.push([a, b]);
          }
        }
      }

      if (pairs.length === 0) return [1, 1];
      return pairs[Math.floor(Math.random() * pairs.length)];
    }

    function playDiceRollAnimation(diceDetail, totalValue, isRoller) {
      const finalFaces = Array.isArray(diceDetail) && diceDetail.length === 2
        ? diceDetail
        : makeDicePairFromTotal(totalValue || 2);

      const [d1, d2] = finalFaces;
      const cx = CANVAS_SIZE / 2;
      const cy = CANVAS_SIZE / 2 + 10;

      playEventBanner(`DICE: ${d1} + ${d2} = ${d1 + d2}`, 0x1d2836, isRoller ? 1200 : 1000);

      const createOneDie = (targetX, targetY, faceValue, delay = 0) => {
        const shadow = scene.add.ellipse(targetX, targetY + 36, 62, 20, 0x000000, 0.18)
          .setDepth(94)
          .setScale(0.25, 0.25)
          .setAlpha(0);

        const die = scene.add.image(
          targetX - Phaser.Math.Between(70, 120),
          -140,
          `dice_face_${Phaser.Math.Between(1, 6)}`
        ).setDepth(95);

        die.setDisplaySize(84, 84);
        die.setAngle(Phaser.Math.Between(-120, 120));

        const randomizer = scene.time.addEvent({
          delay: 46,
          loop: true,
          callback: () => {
            die.setTexture(`dice_face_${Phaser.Math.Between(1, 6)}`);
          }
        });

        const rollDuration = isRoller ? 440 : 340;
        const visibleHold = isRoller ? 1600 : 1200;

        scene.tweens.add({
          targets: die,
          x: targetX,
          y: targetY,
          angle: die.angle + Phaser.Math.Between(720, 960),
          duration: rollDuration,
          delay,
          ease: "Cubic.easeIn"
        });

        scene.tweens.add({
          targets: shadow,
          alpha: 0.26,
          scaleX: 1,
          scaleY: 1,
          duration: 260,
          delay,
          ease: "Sine.easeOut"
        });

        scene.time.delayedCall(delay + rollDuration, () => {
          scene.cameras.main.shake(90, 0.0022);

          scene.tweens.add({
            targets: die,
            y: targetY + 10,
            duration: 180,
            yoyo: true,
            repeat: 1,
            ease: "Bounce.easeOut",
            onComplete: () => {
              randomizer.remove();
              die.setTexture(`dice_face_${faceValue}`);
              die.setAngle(Phaser.Math.Between(-8, 8));

              scene.tweens.add({
                targets: die,
                scaleX: 1.07,
                scaleY: 0.93,
                duration: 90,
                yoyo: true
              });
            }
          });
        });

        scene.time.delayedCall(delay + visibleHold, () => {
          scene.tweens.add({
            targets: [die, shadow],
            alpha: 0,
            duration: 220,
            onComplete: () => {
              die.destroy();
              shadow.destroy();
            }
          });
        });
      };

      createOneDie(cx - 55, cy, d1, 0);
      createOneDie(cx + 55, cy + 8, d2, 120);
    }

    function upsertToken(player, idx) {
      if (!player.pos) {
        // Pas encore de position (lobby pré-partie) : on détruit l'éventuel token
        // de la partie précédente pour ne pas afficher de vieilles positions
        if (tokens.has(player.id)) {
          const obj = tokens.get(player.id);
          if (obj.highlightRing) obj.highlightRing.destroy();
          obj.sprite.destroy();
          obj.label.destroy();
          if (obj.shadow) obj.shadow.destroy();
          tokens.delete(player.id);
        }
        return;
      }

      const { x, y } = toPixel(player.pos.col, player.pos.row);
      const labelText = player.name;
      const tokenColor = getTokenColor(player, idx);
      const portraitKey = getCharacterPortrait(player.character);

      if (tokens.has(player.id)) {
        const obj = tokens.get(player.id);
        obj.label.setText(labelText);

        if (obj.portraitKey !== portraitKey) {
          obj.sprite.setTexture(portraitKey);
          obj.portraitKey = portraitKey;
        }

        obj.color = tokenColor;

        const oldPos = obj.lastPos;
        const distance = getMoveDistance(oldPos, player.pos);

        if (distance > 0) {
          setTokenPosition(obj, x, y);
        }

        obj.lastPos = { ...player.pos };
        return;
      }

      const shadow = scene.add.ellipse(
        x,
        y + VISUAL_CELL_SIZE * 0.4,
        VISUAL_CELL_SIZE * 0.8,
        VISUAL_CELL_SIZE * 0.4,
        0x000000,
        0.6
      ).setDepth(19);

      const sprite = scene.add.image(x, y, portraitKey).setDepth(20);

      const maxWidth = VISUAL_CELL_SIZE * 1.05;
      const maxHeight = VISUAL_CELL_SIZE * 1.25;
      const scale = Math.min(maxWidth / sprite.width, maxHeight / sprite.height);

      sprite.setScale(scale);
      sprite.setOrigin(0.5, 0.72);

      const label = scene.add.text(x, y - VISUAL_CELL_SIZE * 1.2, labelText, {
        fontFamily: "'Cinzel', serif",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#f2eee9",
        backgroundColor: "rgba(20, 16, 13, 0.85)",
        padding: { x: 8, y: 4 },
        stroke: "#b88a5a",
        strokeThickness: 1
      })
        .setOrigin(0.5, 0.5)
        .setDepth(30);

      const tokenObj = {
        sprite,
        label,
        shadow,
        color: tokenColor,
        portraitKey,
        lastPos: { ...player.pos },
        highlightRing: null,
        baseScaleX: sprite.scaleX,
        baseScaleY: sprite.scaleY
      };

      tokens.set(player.id, tokenObj);
      playSpawnAnimation(tokenObj);
    }

    function removeMissingTokens(currentPlayers) {
      const keep = new Set(currentPlayers.map((p) => p.id));

      for (const [id, obj] of tokens.entries()) {
        if (!keep.has(id)) {
          if (obj.highlightRing) obj.highlightRing.destroy();
          obj.sprite.destroy();
          obj.label.destroy();
          if (obj.shadow) obj.shadow.destroy();
          tokens.delete(id);
        }
      }
    }

    function drawGridOverlay(sceneRef) {
      const grid = sceneRef.add.graphics().setDepth(5);
      grid.lineStyle(1, 0xffffff, 0.08);

      for (let i = 0; i <= GRID_SIZE; i++) {
        const x = OFFSET_X + i * VISUAL_CELL_SIZE;
        grid.moveTo(x, Math.max(0, OFFSET_Y));
        grid.lineTo(x, CANVAS_SIZE - Math.max(0, -OFFSET_Y));
      }

      for (let i = 0; i <= GRID_SIZE; i++) {
        const y = OFFSET_Y + i * VISUAL_CELL_SIZE;
        grid.moveTo(Math.max(0, OFFSET_X), y);
        grid.lineTo(CANVAS_SIZE - Math.max(0, -OFFSET_X), y);
      }

      grid.strokePath();
    }

    function clearInteractionMarkers() {
      interactionMarkers.forEach((marker) => marker.destroy());
      interactionMarkers = [];
    }

    function addInteractionMarker(row, col, options = {}) {
      const { x, y } = toCellTopLeft(col, row);

      const inset = options.inset ?? 3;
      const width = options.width ?? (VISUAL_CELL_SIZE - inset * 2);
      const height = options.height ?? (VISUAL_CELL_SIZE - inset * 2);

      const fillColor = options.fillColor ?? 0x2563eb;
      const fillAlpha = options.fillAlpha ?? 0.20;
      const hoverAlpha = options.hoverAlpha ?? Math.min(fillAlpha + 0.18, 0.95);
      const strokeColor = options.strokeColor ?? 0x9bc2ff;
      const strokeAlpha = options.strokeAlpha ?? 1;

      const marker = scene.add.rectangle(
        x + inset,
        y + inset,
        width,
        height,
        fillColor,
        fillAlpha
      )
        .setOrigin(0, 0)
        .setStrokeStyle(2, strokeColor, strokeAlpha)
        .setDepth(options.depth ?? 12)
        .setInteractive({ useHandCursor: true });

      marker.on("pointerover", () => {
        marker.setFillStyle(fillColor, hoverAlpha);
        marker.setStrokeStyle(2, strokeColor, 1);
      });

      marker.on("pointerout", () => {
        marker.setFillStyle(fillColor, fillAlpha);
        marker.setStrokeStyle(2, strokeColor, strokeAlpha);
      });

      if (typeof options.onClick === "function") {
        marker.on("pointerdown", (pointer) => {
          if (pointer?.event?.stopPropagation) {
            pointer.event.stopPropagation();
          }

          options.onClick();
        });
      }

      interactionMarkers.push(marker);

      if (options.text) {
        const label = scene.add.text(
          x + VISUAL_CELL_SIZE / 2,
          y + VISUAL_CELL_SIZE / 2,
          options.text,
          {
            fontFamily: "'Cinzel', serif",
            fontSize: options.textSize ?? "12px",
            color: options.textColor ?? "#f2eee9",
            stroke: "#000000",
            strokeThickness: 3,
            fontStyle: "bold"
          }
        )
          .setOrigin(0.5)
          .setDepth((options.depth ?? 12) + 1);

        interactionMarkers.push(label);
      }
    }

    function emitNextQueuedMove() {
      if (!pendingPathQueue.length || !myTurn || gameIsOver || !isAutoMoving) return;

      const direction = pendingPathQueue.shift();

      socket.emit("move_step", {
        gameCode: getGameCode(),
        direction
      });
    }

    function renderDoorSelectors(roomName, labelFilter = null) {
      const me = getMePlayer();
      if (!me) return;

      const doorEntries = (ROOM_DOORS[roomName] || [])
        .filter((door) => !labelFilter || labelFilter.includes(door.label));

      if (!doorEntries.length) return;

      clearInteractionMarkers();

      doorEntries.forEach((door) => {
        addInteractionMarker(door.row, door.col, {
          fillColor: 0xd97706,
          fillAlpha: 0.24,
          strokeColor: 0xfacc15,
          text: "🚪",
          textSize: "16px",
          onClick: () => {
            clearPendingAutoPath();
            clearInteractionMarkers();

            cachedReachableTargets = new Map();
            pendingDoorLabels = null;
            isAutoMoving = false;

            socket.emit("select_exit_door", {
              gameCode: getGameCode(),
              doorLabel: door.label
            });
          }
        });
      });
    }

    function renderReachableCells() {
      if (!cachedReachableTargets.size) return;

      clearInteractionMarkers();

      cachedReachableTargets.forEach((target, key) => {
        addInteractionMarker(target.row, target.col, {
          fillColor: target.endsInRoom ? 0xd4af37 : 0x4f8cff,
          fillAlpha: target.endsInRoom ? 0.22 : 0.18,
          strokeColor: target.endsInRoom ? 0xfff1a8 : 0xffffff,
          strokeAlpha: target.endsInRoom ? 0.95 : 0.45,
          text: target.endsInRoom ? "🏠" : "",
          textSize: "14px",
          onClick: () => {
            if (pendingPathQueue.length || isAutoMoving) return;

            isAutoMoving = true;
            clearInteractionMarkers();

            pendingPathQueue = [...target.pathDirs];
            pendingPathTargetKey = key;

            emitNextQueuedMove();
          }
        });
      });
    }

    function syncInteractionLayer() {
      clearInteractionMarkers();

      if (gameIsOver || !myTurn) return;
      if (isAutoMoving) return;

      const me = getMePlayer();
      if (!me || !me.pos) return;

      if (pendingDoorLabels?.length) {
        renderDoorSelectors(myRoomName, pendingDoorLabels);
        return;
      }

      if (!myHasRolledDice && myRoomName) {
        const usableDoors = getUsableDoors(myRoomName, me.id);

        if (usableDoors.length) {
          renderDoorSelectors(myRoomName, usableDoors.map((door) => door.label));
          return;
        }
      }

      if (myRemainingMoves > 0) {
        recomputeReachableTargets();
        renderReachableCells();
      }
    }

    const handlers = {
      lobby_update: ({ players }) => {
        playersState = players;
        players.forEach((p, idx) => upsertToken(p, idx));
        removeMissingTokens(players);

        if (myTurn) {
          const me = getMePlayer();

          if (me?.pos && !myRoomName) {
            myRoomName = me.inRoomName || getRoomNameFromPosition(me.pos);
          }

          if (!isAutoMoving) {
            recomputeReachableTargets();
            syncInteractionLayer();
          }
        }
      },

      your_hand: () => {
        gameIsOver = false;
        myHasRolledDice = false;
        myRemainingMoves = 0;
        myPathHistory = [];
        pendingDoorLabels = null;
        cachedReachableTargets = new Map();
        isAutoMoving = false;
        clearPendingAutoPath();
      },

      player_moved: ({ playerId, pos, remainingMoves, inRoom, roomName, validDirs }) => {
        const resolvedRoomName = roomName || (inRoom ? getRoomNameFromPosition(pos) : null);

        const player = getPlayerById(playerId);
        if (player) {
          player.pos = { ...pos };
          player.inRoomName = resolvedRoomName;
        }

        if (!tokens.has(playerId) || !pos) return;

        const obj = tokens.get(playerId);
        const { x, y } = toPixel(pos.col, pos.row);

        resetTokenVisualState(obj);

        const distance = getMoveDistance(obj.lastPos, pos);
        const wasInRoom = !!getRoomNameFromPosition(obj.lastPos);
        const isNowInRoom = !!inRoom;

        if (isNowInRoom && playerId !== currentTurnPlayerId) {
          animateSummonTeleport(obj, x, y);
        } else if (isNowInRoom && !wasInRoom) {
          animateRoomEntry(obj, x, y, playerId);
        } else if (isNowInRoom && wasInRoom && distance > 0) {
          animateTeleport(obj, x, y, {
            flashColor: 0xffffff,
            pulseColor: 0xffffff
          });
        } else if (!isNowInRoom && wasInRoom && distance > 0) {
          animateTeleport(obj, x, y, {
            flashColor: 0xd97706,
            pulseColor: 0xd97706
          });
        } else if (distance > 0) {
          animateTokenMove(obj, x, y, PAWN_STEP_DURATION);
        } else {
          setTokenPosition(obj, x, y);
        }

        obj.lastPos = { ...pos };

        if (playerId === socket.id) {
          if (typeof remainingMoves === "number") {
            myRemainingMoves = remainingMoves;
          }

          const lastStep = myPathHistory[myPathHistory.length - 1];

          if (!lastStep || lastStep.row !== pos.row || lastStep.col !== pos.col) {
            myPathHistory.push({ row: pos.row, col: pos.col });
          }

          myRoomName = resolvedRoomName;
          pendingDoorLabels = null;

          const currentKey = keyForPos(pos.row, pos.col);

          if (isNowInRoom || myRemainingMoves <= 0 || currentKey === pendingPathTargetKey) {
            clearPendingAutoPath();
            isAutoMoving = false;
            cachedReachableTargets = new Map();
            recomputeReachableTargets();
            syncInteractionLayer();
          } else if (pendingPathQueue.length) {
            scene.time.delayedCall(AUTO_PATH_NEXT_STEP_DELAY, emitNextQueuedMove);
          } else {
            isAutoMoving = false;
            recomputeReachableTargets();
            syncInteractionLayer();
          }
        }
      },

      turn_update: ({ currentPlayerId, currentRoom, wasSummoned }) => {
        currentTurnPlayerId = currentPlayerId;
        highlightCurrentPlayer(currentPlayerId);

        const amITheCurrentPlayer = currentPlayerId === socket.id;
        myTurn = amITheCurrentPlayer;

        if (lastTurnPlayerId !== currentPlayerId) {
          playTurnBanner(currentPlayerId);
        }

        lastTurnPlayerId = currentPlayerId;

        if (amITheCurrentPlayer) {
          myHasRolledDice = !!wasSummoned;
          myRemainingMoves = 0;
          myPathHistory = [];
          pendingDoorLabels = null;
          cachedReachableTargets = new Map();
          isAutoMoving = false;
          clearPendingAutoPath();

          const me = getMePlayer();
          myRoomName = currentRoom || me?.inRoomName || (me?.pos ? getRoomNameFromPosition(me.pos) : null);

          if (wasSummoned) {
            setStatusLine("Vous avez été invoqué dans cette salle : vous pouvez suggérer immédiatement.");
          }
        } else {
          myRemainingMoves = 0;
          pendingDoorLabels = null;
          cachedReachableTargets = new Map();
          isAutoMoving = false;
          clearPendingAutoPath();
          clearInteractionMarkers();
        }

        syncInteractionLayer();
      },

      dice_rolled: ({ playerId, value, diceDetail }) => {
        playDiceRollAnimation(diceDetail, value, socket.id === playerId);

        if (playerId === socket.id) {
          myHasRolledDice = true;
          myRemainingMoves = value || 0;
          pendingDoorLabels = null;
          cachedReachableTargets = new Map();
          isAutoMoving = false;
          clearPendingAutoPath();

          const me = getMePlayer();
          myPathHistory = me?.pos ? [{ row: me.pos.row, col: me.pos.col }] : [];
          myRoomName = me?.inRoomName || (me?.pos ? getRoomNameFromPosition(me.pos) : null);

          scene.time.delayedCall(1600, () => {
            if (!myTurn || gameIsOver || isAutoMoving) return;

            recomputeReachableTargets();
            syncInteractionLayer();
          });
        }
      },

      ask_exit_door: ({ doors }) => {
        if (!myTurn) return;

        pendingDoorLabels = Array.isArray(doors) ? doors : [];
        cachedReachableTargets = new Map();
        isAutoMoving = false;
        clearPendingAutoPath();

        playEventBanner("CHOISISSEZ UNE PORTE", 0x3a2b12, 1300);
        syncInteractionLayer();
      },

      card_revealed: ({ fromPlayerId, fromPlayerName, card }) => {
        const fromPlayer = getPlayerById(fromPlayerId);
        const nameToShow = fromPlayer ? fromPlayer.name : (fromPlayerName || "Someone");
      },

      suggestion_made: ({ byPlayerId, suspect, weapon, room }) => {
        if (byPlayerId === socket.id) {
          myRemainingMoves = 0;
          cachedReachableTargets = new Map();
          isAutoMoving = false;
          clearInteractionMarkers();
        }

        playSuggestionAnnouncement(byPlayerId, suspect, weapon, room);
      },

      waiting_for_disprove: () => {
        playEventBanner("WAITING FOR DISPROVE...", 0x2b2b2b, 1500);
      },

      no_one_disproved: () => {
        playEventBanner("NO ONE DISPROVED", 0x5b3a12, 1900);
      },

      someone_disproved: () => {
        playEventBanner("SOMEONE DISPROVED", 0x2d3b1f, 1900);
      },

      accusation_wrong: ({ message }) => {
        clearPendingAutoPath();
        cachedReachableTargets = new Map();
        isAutoMoving = false;
        clearInteractionMarkers();
        playWrongAccusationEffect(message || "Wrong accusation! You are eliminated.");
      },

      game_won: ({ winnerId }) => {
        gameIsOver = true;
        myTurn = false;
        myRemainingMoves = 0;
        pendingDoorLabels = null;
        cachedReachableTargets = new Map();
        isAutoMoving = false;
        clearPendingAutoPath();
        clearInteractionMarkers();
        clearTurnHighlights();

        const winnerName = getPlayerName(winnerId);

        if (tokens.has(winnerId)) {
          const obj = tokens.get(winnerId);
          playVictoryEffect(obj);
        }

        if (winnerId === socket.id) {
          playCenterNotice("VICTORY", "You solved the case!", {
            width: 420,
            height: 150,
            hold: 1600,
            accentColor: 0xd4af37,
            overlayAlpha: 0.25,
            panelColor: 0x102010,
            titleColor: "#ffe48a",
            subtitleColor: "#f2eee9",
            depth: 98
          });
        } else {
          playCenterNotice("CASE CLOSED", `${winnerName} solved the case.`, {
            width: 430,
            height: 150,
            hold: 1600,
            accentColor: 0xd4af37,
            overlayAlpha: 0.20,
            panelColor: 0x171717,
            titleColor: "#f2eee9",
            subtitleColor: "#f2eee9",
            depth: 98
          });
        }
      },

      player_eliminated: ({ playerId }) => {
        const player = getPlayerById(playerId);
        if (player) player.eliminated = true;

        if (tokens.has(playerId)) {
          const obj = tokens.get(playerId);
          playEliminationEffect(obj);
        }

        if (playerId === socket.id) {
          myTurn = false;
          myRemainingMoves = 0;
          cachedReachableTargets = new Map();
          isAutoMoving = false;
          clearPendingAutoPath();
          clearInteractionMarkers();
        }
      },

      error_msg: () => {
        clearPendingAutoPath();
        isAutoMoving = false;
        recomputeReachableTargets();
        syncInteractionLayer();
      }
    };

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));

    scene.events.once("shutdown", () => {
      Object.entries(handlers).forEach(([evt, fn]) => socket.off(evt, fn));
      destroyActiveTopBanner();
      clearTurnHighlights();
      clearInteractionMarkers();
    });
  }
});