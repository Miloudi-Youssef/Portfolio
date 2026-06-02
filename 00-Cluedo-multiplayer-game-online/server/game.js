// server/game.js

const SUSPECTS = ["Scarlet", "Mustard", "White", "Green", "Peacock", "Plum"];
const WEAPONS = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench"];
const ROOMS = [
  "Kitchen",
  "Ballroom",
  "Conservatory",
  "Dining Room",
  "Billiard Room",
  "Library",
  "Lounge",
  "Hall",
  "Study",
];

// Structure du plateau pour le serveur Python
// 0: Mur/Inaccessible
// 1: Couloir, case accessible
// 2: Pièce, case non accessible
// D1-6: Départ 1 à 6
// 'Lettre' = Entrée et Sortie de :
// C = Kitchen, G1-4 = Ballroom, S1-2 = Dining Room, V = Conservatory, H1-4 = Hall, B1-2 = Billiard Room, O = Library, E1-2 = Study, P = Lounge
const CLUEDO_BOARD = [
  [2, 2, 2, 2, 2, 2, 0, 0, 0, 'D5', 2, 2, 2, 2, 2, 'D6', 0, 0, 0, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 0, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 'P', 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 1, 1, 'G1', 2, 2, 2, 2, 2, 2, 2, 'G4', 1, 1, 1, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 'C', 1, 1, 2, 'G2', 2, 2, 2, 2, 2, 'G3', 2, 1, 1, 1, 1, 1, 1, 1, 'D1'],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 'E2', 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 'E1', 2],
  [2, 2, 2, 2, 2, 2, 2, 'S1', 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 'B2', 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 'S2', 2, 1, 1, 0, 0, 0, 0, 0, 1, 1, 'B1', 2, 2, 2, 2, 2, 2, 2],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2],
  ['D4', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 'H1', 'H2', 'H3', 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 'D2'],
  [2, 2, 2, 2, 2, 2, 'V', 1, 1, 2, 2, 2, 2, 2, 2, 'H4', 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 'O', 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2],
  [2, 2, 2, 2, 2, 2, 2, 'D3', 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 2, 2, 2, 2, 2, 2, 2]
];

const ROOM_MAP = {
  'C': "Kitchen",
  'G1': "Ballroom", 'G2': "Ballroom", 'G3': "Ballroom", 'G4': "Ballroom",
  'V': "Conservatory",
  'S1': "Dining Room", 'S2': "Dining Room",
  'B1': "Billiard Room", 'B2': "Billiard Room",
  'O': "Library",
  'P': "Lounge",
  'H1': "Hall", 'H2': "Hall", 'H3': "Hall", 'H4': "Hall",
  'E1': "Study", 'E2': "Study"
};

const ROOM_DOORS = {
  "Lounge": [{ row: 4, col: 20, label: 'P' }],
  "Kitchen": [{ row: 6, col: 5, label: 'C' }],
  "Conservatory": [{ row: 19, col: 6, label: 'V' }],
  "Library": [{ row: 20, col: 18, label: 'O' }],
  "Ballroom": [
    { row: 5, col: 8, label: 'G1' },
    { row: 6, col: 9, label: 'G2' },
    { row: 6, col: 15, label: 'G3' },
    { row: 5, col: 16, label: 'G4' }
  ],
  "Dining Room": [
    { row: 12, col: 7, label: 'S1' },
    { row: 15, col: 6, label: 'S2' }
  ],
  "Billiard Room": [
    { row: 15, col: 17, label: 'B1' },
    { row: 13, col: 21, label: 'B2' }
  ],
  "Hall": [
    { row: 18, col: 11, label: 'H1' },
    { row: 18, col: 12, label: 'H2' },
    { row: 18, col: 13, label: 'H3' },
    { row: 19, col: 15, label: 'H4' }
  ],
  "Study": [
    { row: 11, col: 23, label: 'E1' },
    { row: 9, col: 18, label: 'E2' }
  ]
};

const ROOM_SEATS = {
  "Lounge": [
    { row: 1, col: 21 }, { row: 1, col: 22 }, { row: 1, col: 23 },
    { row: 2, col: 21 }, { row: 2, col: 22 }, { row: 2, col: 23 }
  ],
  "Kitchen": [
    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
    { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }
  ],
  "Conservatory": [
    { row: 21, col: 2 }, { row: 21, col: 3 }, { row: 21, col: 4 },
    { row: 22, col: 2 }, { row: 22, col: 3 }, { row: 22, col: 4 }
  ],
  "Library": [
    { row: 21, col: 20 }, { row: 21, col: 21 }, { row: 21, col: 22 },
    { row: 22, col: 20 }, { row: 22, col: 21 }, { row: 22, col: 22 }
  ],
  "Ballroom": [
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
  "Hall": [
    { row: 21, col: 10 }, { row: 21, col: 11 }, { row: 21, col: 12 },
    { row: 22, col: 10 }, { row: 22, col: 11 }, { row: 22, col: 12 }
  ],
  "Study": [
    { row: 9, col: 20 }, { row: 9, col: 21 }, { row: 9, col: 22 },
    { row: 10, col: 20 }, { row: 10, col: 21 }, { row: 10, col: 22 }
  ]
};

const SECRET_PASSAGES = {
  "Kitchen": "Library",
  "Library": "Kitchen",
  "Lounge": "Conservatory",
  "Conservatory": "Lounge"
};

function createGameModule(io) {
  const games = {};

  function makeCode() {
    return Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function isValidTile(col, row) {
    if (row < 0 || row >= CLUEDO_BOARD.length || col < 0 || col >= CLUEDO_BOARD[0].length) return false;
    const tile = CLUEDO_BOARD[row][col];
    return tile === 1 || typeof tile === 'string';
  }

  function getValidDirections(game, player) {
    if (game.currentMoveLimit <= 0) return [];
    const valid = [];
    const { row, col } = player.pos;

    const directions = [
      { dir: 'z', dr: -1, dc: 0 }, 
      { dir: 's', dr: 1, dc: 0 },  
      { dir: 'q', dr: 0, dc: -1 }, 
      { dir: 'd', dr: 0, dc: 1 }   
    ];

    const currentCell = CLUEDO_BOARD[row][col];

    for (const { dir, dr, dc } of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (!isValidTile(newCol, newRow)) continue;

      const targetCell = CLUEDO_BOARD[newRow][newCol];

      if (targetCell === 'O' && dir !== 's') continue;
      if (targetCell === 'V' && dir !== 'q') continue;
      if (targetCell === 'C' && dir !== 'q') continue;

      if (currentCell === 'O' && dir !== 'z') continue;
      if (currentCell === 'V' && dir !== 'd') continue;
      if (currentCell === 'C' && dir !== 'd') continue;
      if (currentCell === 'H1' && dir !== 'z') continue;
      if (currentCell === 'H2' && dir !== 'z') continue;
      if (currentCell === 'H3' && dir !== 'z') continue;

      if (game.currentPath && game.currentPath.some(step => step.row === newRow && step.col === newCol)) continue;

      const isOccupied = game.players.some(p =>
        !p.eliminated &&
        p.id !== player.id &&
        p.pos &&
        p.pos.row === newRow &&
        p.pos.col === newCol
      );
      if (isOccupied) continue;

      valid.push(dir);
    }
    return valid;
  }

  function printBoardState(game) {
    console.log("\n--- ÉTAT DU PLATEAU ---");
    let displayBoard = CLUEDO_BOARD.map(row => [...row]);

    game.players.forEach((p, i) => {
      if (!p.eliminated && p.pos) {
        displayBoard[p.pos.row][p.pos.col] = `J${i + 1}`;
      }
    });

    displayBoard.forEach(row => {
      console.log(row.map(cell => String(cell).padStart(3, ' ')).join(" "));
    });
    console.log("-----------------------\n");
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function emitLobbyUpdate(code) {
    const game = games[code];
    if (!game) return;
    io.to(code).emit("lobby_update", {
      gameCode: code,
      players: game.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        eliminated: !!p.eliminated,
        pos: p.pos,
        character: p.character,
        inRoomName: p.inRoomName || null
      })),
    });
  }

  function findNextActiveIndex(game, startIndex) {
    if (!game.players.length) return 0;
    for (let step = 1; step <= game.players.length; step++) {
      const i = (startIndex + step) % game.players.length;
      if (!game.players[i].eliminated) return i;
    }
    return startIndex; 
  }

  function ensureTurnOnActivePlayer(game) {
    if (!game.players.length) return;
    if (!game.players[game.turnIndex] || game.players[game.turnIndex].eliminated) {
      game.turnIndex = findNextActiveIndex(game, game.turnIndex);
    }
  }

  function emitTurnUpdate(code) {
    const game = games[code];
    if (!game || !game.players.length || !game.started || game.gameOver) return;

    ensureTurnOnActivePlayer(game);
    const currentPlayer = game.players[game.turnIndex];

    io.to(code).emit("turn_update", {
      currentPlayerId: currentPlayer.id,
      currentRoom: currentPlayer.inRoomName, 
      wasSummoned: !!currentPlayer.wasSummoned
    });
  }

  function advanceTurn(code) {
    const game = games[code];
    if (!game || !game.players.length || game.gameOver) return;

    game.currentMoveLimit = 0;
    game.hasRolledDice = false;
    game.hasMadeSuggestion = false;

    ensureTurnOnActivePlayer(game);

    if (game.players[game.turnIndex]) {
      game.players[game.turnIndex].wasSummoned = false;
    }

    game.turnIndex = findNextActiveIndex(game, game.turnIndex);
    emitTurnUpdate(code);
  }

  function cancelPending(game) {
    game.pending = null;
  }

  function askNextResponder(code) {
    const game = games[code];
    if (!game?.pending || game.gameOver) return;

    const { suggesterId, suspect, weapon, room } = game.pending;

    const suggester = game.players.find((p) => p.id === suggesterId);
    if (!suggester || suggester.eliminated) {
      cancelPending(game);
      emitTurnUpdate(code);
      return;
    }

    for (let step = 1; step <= game.players.length; step++) {
      const idx = (game.pending.responderIndex + step - 1) % game.players.length;
      const p = game.players[idx];
      if (!p) continue;
      if (p.id === suggesterId) break; 

      game.pending.responderIndex = idx; 
      const hand = game.hands[p.id] || [];
      const matches = hand.filter(
        (c) =>
          c === "Suspect: " + suspect ||
          c === "Weapon: " + weapon ||
          c === "Room: " + room
      );

      if (matches.length === 0) continue;

      io.to(p.id).emit("you_must_disprove", {
        gameCode: code,
        suspect,
        weapon,
        room,
        options: matches,
        suggesterName: suggester.name
      });

      io.to(code).emit("waiting_for_disprove", {
        responderId: p.id,
        suggesterId,
      });
      return;
    }

    io.to(code).emit("no_one_disproved", {
      suggesterId,
      suggesterName: suggester.name,
      suspect, 
      weapon,  
      room     
    });
    cancelPending(game);
  }

  // On passe le socket (et plus seulement l'ID) pour qu'il quitte la salle réseau
  function removePlayerFromGames(socket) {
    for (const [code, game] of Object.entries(games)) {
      const idx = game.players.findIndex((p) => p.id === socket.id);
      if (idx === -1) continue;

      const wasHost = game.players[idx].isHost;
      const wasMyTurn = (game.turnIndex === idx);
      const leavingPlayer = game.players[idx];
      const leavingPlayerCards = game.hands[socket.id] || [];

      // Combien de joueurs actifs RESTERAIENT après le splice ?
      const activeAfterRemoval = game.players.filter(
        (p, i) => i !== idx && !p.eliminated
      ).length;

      // Prépare l'auto-disprove AVANT le splice (on a encore accès aux données
      // du joueur), mais on émettra les events APRÈS emitTurnUpdate pour que
      // card_revealed arrive en DERNIER sur le client et réactive bien le bouton
      // "End Turn" (sinon turn_update le remettrait à disabled juste après).
      let pendingAutoDisprove = null;

      const leaverIsCurrentResponder = !!game.pending &&
        game.pending.suggesterId !== socket.id &&
        game.players[game.pending.responderIndex]?.id === socket.id;

      if (leaverIsCurrentResponder && activeAfterRemoval > 1) {
        const { suggesterId, suspect, weapon, room } = game.pending;
        const suggester = game.players.find((p) => p.id === suggesterId);
        const hand = game.hands[socket.id] || [];
        const matches = hand.filter((c) =>
          c === "Suspect: " + suspect ||
          c === "Weapon: " + weapon ||
          c === "Room: " + room
        );

        if (matches.length > 0 && suggester && !suggester.eliminated) {
          const cardToReveal = matches[Math.floor(Math.random() * matches.length)];
          pendingAutoDisprove = {
            suggesterId,
            suggesterName: suggester.name,
            responderName: leavingPlayer.name,
            responderId: socket.id,
            card: cardToReveal,
            suspect, weapon, room
          };
          console.log(`[AUTO-DISPROVE] ${leavingPlayer.name} déconnecté pendant sa réponse. Carte auto-révélée : ${cardToReveal} → ${suggester.name}`);
        }
        cancelPending(game);
      } else if (game.pending && (game.pending.suggesterId === socket.id || game.players[game.pending.responderIndex]?.id === socket.id)) {
        cancelPending(game);
      }

      game.players.splice(idx, 1);
      
      // ON FORCE LE SOCKET A QUITTER LA SALLE RESEAU ! Fini les fantômes !
      if (socket.connected) {
          socket.leave(code);
      }

      if (game.started && leavingPlayerCards.length > 0) {
        io.to(code).emit("player_disconnected_cards", {
        playerId: leavingPlayer.id,
        playerName: leavingPlayer.name,
        cards: leavingPlayerCards
      });
      }

      if (wasHost && game.players.length > 0) {
        game.players[0].isHost = true;
      }

      if (game.players.length === 0) {
        delete games[code];
        break; 
      }

      if (game.started && !game.gameOver) {
        const activePlayers = game.players.filter(p => !p.eliminated);
        
        if (activePlayers.length === 1) {
            game.gameOver = true;
            cancelPending(game);
            io.to(code).emit("game_won", {
                winnerId: activePlayers[0].id,
                solution: game.solution,
                lastManStanding: true
            });
            break; 
        }

        if (wasMyTurn) {
            if (game.turnIndex >= game.players.length) game.turnIndex = 0;
            game.currentMoveLimit = 0;
            game.hasRolledDice = false;
            game.currentPath = [];
            ensureTurnOnActivePlayer(game);
        } else if (idx < game.turnIndex) {
            game.turnIndex--;
        }
      }

      emitLobbyUpdate(code);
      if (game.started && !game.gameOver) emitTurnUpdate(code);

      // On émet l'auto-disprove ICI, après turn_update, pour que card_revealed
      // arrive EN DERNIER sur le client. Ainsi il réactive bien endTurnBtn après
      // que setActionButtons (déclenché par turn_update) l'ait remis à disabled.
      if (pendingAutoDisprove) {
        const { suggesterId, suggesterName, responderName, responderId, card, suspect, weapon, room } = pendingAutoDisprove;
        io.to(suggesterId).emit("card_revealed", {
          fromPlayerId: responderId,
          fromPlayerName: responderName,
          card
        });
        io.to(code).emit("someone_disproved", {
          responderId,
          responderName,
          suggesterId,
          suggesterName,
          suspect, weapon, room
        });
      }

      break;
    }
  }

  //
  // SOCKET LOGIC
  // --------------
  io.on("connection", (socket) => {
    console.log(" Connected:", socket.id);

    socket.on("leave_game", () => {
      //Utilisation du nouveau paramètre "socket"
      removePlayerFromGames(socket);
    });

    socket.on("create_game", ({ name } = {}) => {
      let code = makeCode();
      while (games[code]) code = makeCode();

      games[code] = {
        players: [
          {
            id: socket.id,
            name: String(name || "Host").slice(0, 16),
            isHost: true,
            eliminated: false,
          },
        ],
        started: false,
        gameOver: false,
        solution: null,
        hands: {},
        turnIndex: 0,
        pending: null,
        currentMoveLimit: 0,
        hasRolledDice: false,
        hasMadeSuggestion: false,
      };

      socket.join(code);
      socket.emit("game_created", { gameCode: code });
      emitLobbyUpdate(code);
    });

    socket.on("join_game", ({ gameCode, name } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];

      if (!game) return socket.emit("error_msg", { message: "Game not found" });
      if (game.started) return socket.emit("error_msg", { message: "Game already started" });

      const existing = game.players.find((p) => p.id === socket.id);
      if (!existing) {
        if (game.players.length >= 6) {
          return socket.emit("error_msg", { message: "The game is full (maximum 6 players)" });
        }

        // Bloquer si le pseudonyme est déjà utilisé par un autre joueur dans cette partie
        const nameExists = game.players.some(p => p.name.toLowerCase() === String(name || "").trim().toLowerCase());
        if (nameExists) {
            return socket.emit("error_msg", { message: "An investigator with this alias is already in this game!" });
        }

        game.players.push({
          id: socket.id,
          name: String(name || "Player").slice(0, 16),
          isHost: false,
          eliminated: false,
        });
      }

      socket.join(code);
      emitLobbyUpdate(code);
    });

    socket.on("select_character", ({ gameCode, characterName, confirm }) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game || game.started) {
        if (confirm) {
          socket.emit("character_selected", {
            success: false,
            message: "Game not found or already started. Please create or join a new game."
          });
        }
        return;
      }

      const me = game.players.find((p) => p.id === socket.id);
      if (!me) {
        if (confirm) {
          socket.emit("character_selected", {
            success: false,
            message: "You are no longer in this game. Please rejoin."
          });
        }
        return;
      }

      const targetName = characterName.toLowerCase();
      const isTaken = game.players.some(p =>
        p.id !== socket.id &&
        p.character && p.character.toLowerCase() === targetName
      );

      if (!isTaken) {
        me.character = targetName.charAt(0).toUpperCase() + targetName.slice(1);
        emitLobbyUpdate(code);
        if (confirm) {
          socket.emit("character_selected", { success: true });
        }
      } else {
        if (confirm) {
          socket.emit("character_selected", { success: false, message: "This investigator is already busy!" });
        } else {
          socket.emit("error_msg", { message: "This investigator is already busy!" });
        }
      }
    });

    socket.on("start_game", ({ gameCode } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];

      if (!game) return socket.emit("error_msg", { message: "Game not found" });

      const me = game.players.find((p) => p.id === socket.id);
      if (!me || !me.isHost) {
        return socket.emit("error_msg", { message: "Only the host can start the game" });
      }

      if (game.started) return socket.emit("error_msg", { message: "Game already started" });
      if (game.players.length < 2) return socket.emit("error_msg", { message: "Need at least 2 players" });

      const solution = {
        suspect: pickRandom(SUSPECTS),
        weapon: pickRandom(WEAPONS),
        room: pickRandom(ROOMS),
      };

      const chosenCharacters = game.players.map(p => p.character).filter(c => c);
      const remainingSuspects = SUSPECTS.filter(s => !chosenCharacters.includes(s));
      shuffle(remainingSuspects);

      game.players.forEach((player) => {
        if (!player.character) {
          player.character = remainingSuspects.pop();
        }
      });

      const deck = [];
      for (const s of SUSPECTS) if (s !== solution.suspect) deck.push("Suspect: " + s);
      for (const w of WEAPONS) if (w !== solution.weapon) deck.push("Weapon: " + w);
      for (const r of ROOMS) if (r !== solution.room) deck.push("Room: " + r);

      shuffle(deck);

      const hands = {};
      for (const p of game.players) hands[p.id] = [];

      for (let i = 0; i < deck.length; i++) {
        const pid = game.players[i % game.players.length].id;
        hands[pid].push(deck[i]);
      }

      game.players.forEach((player, index) => {
        const spawnLabel = `D${index + 1}`;
        for (let r = 0; r < CLUEDO_BOARD.length; r++) {
          for (let c = 0; c < CLUEDO_BOARD[r].length; c++) {
            if (CLUEDO_BOARD[r][c] === spawnLabel) {
              player.pos = { row: r, col: c };
            }
          }
        }
      });

      game.started = true;
      game.gameOver = false;
      game.solution = solution;
      game.hands = hands;
      game.turnIndex = 0;
      game.pending = null;
      game.currentMoveLimit = 0;
      game.hasRolledDice = false;
      game.hasMadeSuggestion = false;

      for (const p of game.players) p.eliminated = false;

      for (const p of game.players) {
        io.to(p.id).emit("your_hand", { hand: hands[p.id] });
      }

      emitLobbyUpdate(code); 
      emitTurnUpdate(code);

      console.log(" Game started:", code);
      console.log(" Secret solution:", solution);
      console.log(" Players positions initialized on board.");

      printBoardState(game);
    });

    socket.on("make_suggestion", ({ gameCode, suspect, weapon, room } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game || !game.started || game.gameOver) return;

      const me = game.players.find((p) => p.id === socket.id);
      if (!me || me.eliminated) {
        return socket.emit("error_msg", { message: "You are eliminated" });
      }

      ensureTurnOnActivePlayer(game);

      const currentId = game.players[game.turnIndex]?.id;
      if (socket.id !== currentId) return socket.emit("error_msg", { message: "Not your turn" });
      
      if (game.pending) return socket.emit("error_msg", { message: "Suggestion already pending" });

      if (game.hasMadeSuggestion) {
        return socket.emit("already_suggested_this_turn");
      }

      if (!SUSPECTS.includes(suspect) || !WEAPONS.includes(weapon) || !ROOMS.includes(room)) {
          return socket.emit("error_msg", { message: "Invalid suggestion payload. Stop hacking." });
      }

      if (!game.hasRolledDice) {
        if (me.wasSummoned) {
          game.hasRolledDice = true;
          game.currentMoveLimit = 0;
          me.wasSummoned = false; 
        } else {
          return socket.emit("error_msg", { message: "You must roll the dice before making a suggestion!" });
        }
      } else if (game.currentMoveLimit > 0) {
        return socket.emit("error_msg", { message: "Finish your trips first." });
      }

      const currentCell = CLUEDO_BOARD[me.pos.row][me.pos.col];
      const actualRoomName = me.inRoomName || ROOM_MAP[currentCell];

      if (!actualRoomName) {
        return socket.emit("error_msg", { message: "You are not in a valid room to make a suggestion." });
      }

      if (room !== actualRoomName) {
        return socket.emit("error_msg", {
          message: `Cheating detected! You are in the ${actualRoomName}, you can only suggest this room.`
        });
      }

      const summonedPlayer = game.players.find(p => p.character === suspect);

      if (summonedPlayer && summonedPlayer.id !== socket.id) {
        const sIndex = game.players.findIndex(p => p.id === summonedPlayer.id);
        const seat = ROOM_SEATS[actualRoomName] ? ROOM_SEATS[actualRoomName][sIndex] : null;

        if (seat) {
          summonedPlayer.pos = { row: seat.row, col: seat.col };
          summonedPlayer.inRoomName = actualRoomName;
          summonedPlayer.wasSummoned = true;

          io.to(code).emit("player_moved", {
            playerId: summonedPlayer.id,
            pos: summonedPlayer.pos,
            remainingMoves: 0,
            inRoom: true,
            roomName: actualRoomName 
          });
          console.log(`[BACKEND] 🌪️ Invoqué : ${summonedPlayer.name} (${suspect}) a été téléporté(e) dans ${actualRoomName}`);
        }
      }

      game.pending = {
        suggesterId: socket.id,
        suspect,
        weapon,
        room,
        responderIndex: (game.turnIndex + 1) % game.players.length,
      };
      game.hasMadeSuggestion = true;

      io.to(code).emit("suggestion_made", { byPlayerId: socket.id, suspect, weapon, room });
      askNextResponder(code);
    });

    socket.on("roll_dice", ({ gameCode } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game || !game.started || game.gameOver) return;

      const me = game.players.find((p) => p.id === socket.id);
      if (!me || me.eliminated) return;

      ensureTurnOnActivePlayer(game);
      const currentId = game.players[game.turnIndex]?.id;
      
      if (socket.id !== currentId) {
        return socket.emit("error_msg", { message: "Not your turn" });
      }

      if (game.pending) {
        return socket.emit("error_msg", { message: "Cannot roll dice while an action is pending." });
      }

      if (game.hasRolledDice) {
        return socket.emit("error_msg", { message: "You have already rolled the dice for this round!" });
      }

      if (me.inRoomName) {
        const doors = ROOM_DOORS[me.inRoomName];

        const unblockedDoors = doors.filter(door => {
          const tempPos = me.pos;
          const tempLimit = game.currentMoveLimit;
          const tempPath = game.currentPath;

          me.pos = { row: door.row, col: door.col };
          game.currentMoveLimit = 1; 
          game.currentPath = []; 

          const possibleDirs = getValidDirections(game, me);

          me.pos = tempPos;
          game.currentMoveLimit = tempLimit;
          game.currentPath = tempPath;

          return possibleDirs.length > 0;
        });

        if (unblockedDoors.length === 0) {
          game.hasRolledDice = true;
          game.currentMoveLimit = 0;
          io.to(code).emit("player_moved", {
            playerId: socket.id, pos: me.pos, remainingMoves: 0, inRoom: true, roomName: me.inRoomName, validDirs: []
          });
          return socket.emit("error_msg", { message: "All exits are blocked by other players! You lose your movement." });
        }
        else if (unblockedDoors.length > 1) {
          return socket.emit("ask_exit_door", { doors: unblockedDoors.map(d => d.label) });
        }
        else if (unblockedDoors.length === 1) {
          const chosenDoor = unblockedDoors[0];
          me.pos = { row: chosenDoor.row, col: chosenDoor.col };
          me.inRoomName = null;
          io.to(code).emit("player_moved", { playerId: socket.id, pos: me.pos, remainingMoves: 0, inRoom: false, roomName: null });
          console.log(`[BACKEND] ${me.name} sort automatiquement sur la seule porte libre : ${chosenDoor.label}`);
        }
      }

      executeDiceRoll(game, me, code);
    });

    socket.on("use_secret_passage", ({ gameCode } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game || !game.started || game.gameOver) return;

      const me = game.players.find((p) => p.id === socket.id);
      if (!me || me.eliminated) return;

      ensureTurnOnActivePlayer(game);
      
      if (game.players[game.turnIndex]?.id !== socket.id) {
        return socket.emit("error_msg", { message: "Not your turn" });
      }

      if (game.pending) {
        return socket.emit("error_msg", { message: "Cannot use secret passage while an action is pending." });
      }

      if (game.hasRolledDice) {
        return socket.emit("error_msg", { message: "You already moved this turn!" });
      }

      if (!me.inRoomName || !SECRET_PASSAGES[me.inRoomName]) {
        return socket.emit("error_msg", { message: "No secret passage here!" });
      }

      const destRoom = SECRET_PASSAGES[me.inRoomName];

      const myIndex = game.players.findIndex(p => p.id === socket.id);
      const seat = ROOM_SEATS[destRoom] ? ROOM_SEATS[destRoom][myIndex] : null;

      if (seat) {
        me.pos = { row: seat.row, col: seat.col };
        me.inRoomName = destRoom;
      }

      game.hasRolledDice = true;
      game.currentMoveLimit = 0;
      game.currentPath = [{ row: me.pos.row, col: me.pos.col }]; 

      console.log(`[BACKEND] 🚇 ${me.name} prend le passage secret vers ${destRoom}`);
      printBoardState(game);

      io.to(code).emit("player_moved", {
        playerId: socket.id,
        pos: me.pos,
        remainingMoves: 0,
        inRoom: true,
        roomName: destRoom,
        validDirs: []
      });
    });

    socket.on("select_exit_door", ({ gameCode, doorLabel }) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game) return;

      const me = game.players.find((p) => p.id === socket.id);
      
      if (!me) return socket.emit("error_msg", { message: "Player not found." });
      
      ensureTurnOnActivePlayer(game);
      if (game.players[game.turnIndex]?.id !== socket.id) {
          return socket.emit("error_msg", { message: "Not your turn to select a door!" });
      }
      
      if (game.hasRolledDice) {
          return socket.emit("error_msg", { message: "You have already started moving!" });
      }
      if (!me.inRoomName) {
          return socket.emit("error_msg", { message: "You are not in a room!" });
      }

      const doors = ROOM_DOORS[me.inRoomName];
      const chosenDoor = doors?.find(d => d.label === doorLabel.toUpperCase());

      if (chosenDoor) {
        me.pos = { row: chosenDoor.row, col: chosenDoor.col };
        me.inRoomName = null;
        
        io.to(code).emit("player_moved", { playerId: socket.id, pos: me.pos, remainingMoves: 0, inRoom: false, roomName: null });
        console.log(`[BACKEND] ${me.name} sort par la porte choisie : ${chosenDoor.label}`);

        executeDiceRoll(game, me, code);
      } else {
        socket.emit("error_msg", { message: "Invalid door selection. Stop hacking." });
      }
    });

    function executeDiceRoll(game, me, code) {
      game.hasRolledDice = true;
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      game.currentMoveLimit = d1 + d2;

      game.currentPath = [{ row: me.pos.row, col: me.pos.col }];

      console.log(`\n🎲 ${me.name} a fait un ${game.currentMoveLimit} !`);
      printBoardState(game);

      io.to(code).emit("dice_rolled", {
        playerId: me.id,
        value: game.currentMoveLimit,
        diceDetail: [d1, d2],
        validDirs: getValidDirections(game, me)
      });
    }

    socket.on("end_turn", ({ gameCode } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game || !game.started || game.gameOver) return;

      const me = game.players.find((p) => p.id === socket.id);
      if (!me || me.eliminated) return;

      ensureTurnOnActivePlayer(game);
      const currentId = game.players[game.turnIndex]?.id;
      if (socket.id !== currentId) {
        return socket.emit("error_msg", { message: "It's not your turn!" });
      }
      
      if (game.pending) {
          return socket.emit("error_msg", { message: "Cannot end turn while a suggestion is pending!" });
      }

      if (!game.hasRolledDice) {
        return socket.emit("error_msg", { message: "You must roll the dice before ending your turn!" });
      }

      if (game.currentMoveLimit > 0) {
        const validDirs = getValidDirections(game, me);
        if (validDirs.length > 0) {
          return socket.emit("error_msg", { message: `You have ${game.currentMoveLimit} squares(s) left to go!` });
        }
      }

      console.log(`[BACKEND] ${me.name} termine son tour manuellement.`);
      advanceTurn(code);
    });

    socket.on("move_step", ({ gameCode, direction } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];

      if (!game || !game.started || game.gameOver) return;

      const me = game.players.find((p) => p.id === socket.id);
      if (!me || me.eliminated) return;

      ensureTurnOnActivePlayer(game);

      if (game.players[game.turnIndex].id !== socket.id) {
          return socket.emit("error_msg", { message: "Not your turn to move!" });
      }
      
      if (game.currentMoveLimit <= 0) {
          return socket.emit("error_msg", { message: "No moves left!" });
      }
      if (game.pending) {
          return socket.emit("error_msg", { message: "A suggestion is pending, you cannot move!" });
      }

      const validDirs = getValidDirections(game, me);
      if (!validDirs.includes(direction)) {
          return socket.emit("error_msg", { message: "Illegal move direction detected!" });
      }

      let newRow = me.pos.row;
      let newCol = me.pos.col;

      if (direction === 'z') newRow -= 1;
      else if (direction === 's') newRow += 1;
      else if (direction === 'q') newCol -= 1;
      else if (direction === 'd') newCol += 1;

      // Application du mouvement
      me.pos = { row: newRow, col: newCol };
      // Décrémentation après certitude que le mouvement est légal
      game.currentMoveLimit -= 1;

      if (!game.currentPath) game.currentPath = [];
      game.currentPath.push({ row: newRow, col: newCol });

      const targetCell = CLUEDO_BOARD[newRow][newCol];
      const isRoom = typeof targetCell === 'string' && !targetCell.startsWith('D');

      if (isRoom) {
        game.currentMoveLimit = 0;
        const actualRoomName = ROOM_MAP[targetCell];

        const myIndex = game.players.findIndex(p => p.id === socket.id);
        const seat = ROOM_SEATS[actualRoomName] ? ROOM_SEATS[actualRoomName][myIndex] : null;

        if (seat) {
          me.pos = { row: seat.row, col: seat.col }; 
          me.inRoomName = actualRoomName; 
          console.log(`[BACKEND] >>> ${me.name} s'assoit dans ${actualRoomName} [${seat.row}, ${seat.col}] <<<`);
        } else {
          me.inRoomName = actualRoomName;
        }
      } else {
        me.inRoomName = null; 
      }

      console.log(`[MOVE] ${me.name} -> Direction: ${direction} | Restants: ${game.currentMoveLimit}`);
      printBoardState(game);

      io.to(code).emit("player_moved", {
        playerId: socket.id,
        pos: me.pos,
        remainingMoves: game.currentMoveLimit,
        inRoom: isRoom,
        roomName: me.inRoomName || null,
        validDirs: getValidDirections(game, me)
      });
    });

    socket.on("chat_message", ({ gameCode, message } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game) return;

      const player = game.players.find(p => p.id === socket.id);
      if (!player) return;

      io.to(code).emit("chat_message", {
        playerName: player.name,
        message
      });
    });


    socket.on("disprove", ({ gameCode, card } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      
      if (!game?.pending || game.gameOver) return;

      const responder = game.players[game.pending.responderIndex];
      if (!responder || responder.id !== socket.id) {
        return socket.emit("error_msg", { message: "You are not the current responder." });
      }

      const hand = game.hands[socket.id] || [];
      if (!hand.includes(card)) {
        return socket.emit("error_msg", { message: "You don't have that card in your hand." });
      }

      const { suspect, weapon, room } = game.pending;
      if (card !== `Suspect: ${suspect}` && card !== `Weapon: ${weapon}` && card !== `Room: ${room}`) {
          return socket.emit("error_msg", { message: "You must show a card that matches the suggestion!" });
      }

      const suggesterId = game.pending.suggesterId;
      const suggester = game.players.find(p => p.id === suggesterId);

      io.to(suggesterId).emit("card_revealed", {
        fromPlayerId: socket.id,
        fromPlayerName: responder.name,
        card
      });

      io.to(code).emit("someone_disproved", {
        responderId: socket.id,
        responderName: responder.name,
        suggesterId: suggesterId,
        suggesterName: suggester ? suggester.name : "Someone",
        suspect, weapon, room
      });

      cancelPending(game);
    });

    socket.on("make_accusation", ({ gameCode, suspect, weapon, room } = {}) => {
      const code = String(gameCode || "").toUpperCase();
      const game = games[code];
      if (!game || !game.started || game.gameOver) return;

      const me = game.players.find((p) => p.id === socket.id);
      if (!me) return;
      if (me.eliminated) return socket.emit("error_msg", { message: "You are eliminated" });

      ensureTurnOnActivePlayer(game);
      const currentId = game.players[game.turnIndex]?.id;
      
      if (socket.id !== currentId) {
        return socket.emit("error_msg", { message: "You can only make an accusation during your turn" });
      }
      
      if (game.pending) {
          return socket.emit("error_msg", { message: "Cannot accuse while a suggestion is pending!" });
      }

      if (!SUSPECTS.includes(suspect) || !WEAPONS.includes(weapon) || !ROOMS.includes(room)) {
        return socket.emit("error_msg", { message: "Invalid accusation data. Stop hacking." });
      }

      const correct =
        game.solution &&
        game.solution.suspect === suspect &&
        game.solution.weapon === weapon &&
        game.solution.room === room;

      if (correct) {
        game.gameOver = true;
        cancelPending(game);

        io.to(code).emit("game_won", {
          winnerId: socket.id,
          solution: game.solution,
        });
      } else {
        const wasMyTurn = (game.players[game.turnIndex]?.id === socket.id);

        me.eliminated = true;
        io.to(code).emit("player_eliminated", { playerId: socket.id });

        // Révéler les cartes de l'accusateur éliminé aux autres joueurs
        const myCards = game.hands[socket.id] || [];
        io.to(code).emit("wrong_accusation_cards", {
          playerId: socket.id,
          playerName: me.name,
          cards: myCards
        });

        const activePlayers = game.players.filter(p => !p.eliminated);
        if (activePlayers.length === 1) {
          game.gameOver = true;
          cancelPending(game);

          return io.to(code).emit("game_won", {
            winnerId: activePlayers[0].id,
            solution: game.solution,
            lastManStanding: true
          });
        }

        if (wasMyTurn) {
          game.currentMoveLimit = 0;
          game.hasRolledDice = false;
          game.currentPath = [];

          game.turnIndex = findNextActiveIndex(game, game.turnIndex);
          emitTurnUpdate(code);
        } else {
          ensureTurnOnActivePlayer(game);
          emitTurnUpdate(code);
        }

        socket.emit("accusation_wrong", { message: "Wrong accusation! You are eliminated." });
        emitLobbyUpdate(code);
      }
    });

    socket.on("disconnect", () => {
      console.log(" Disconnected:", socket.id);
      setTimeout(() => {
        // Utilisation du nouveau paramètre "socket"
        removePlayerFromGames(socket);
      }, 4000);
    });
  });
}

module.exports = { createGameModule };