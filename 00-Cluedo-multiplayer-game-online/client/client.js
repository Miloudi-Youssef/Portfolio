// client.js

const socket = io({
    transports: ["websocket"]
});
window.socket = socket;

let isCreating = false;
let currentGameCode = null;
let amEliminated = false;
let gameOver = false;
let inGame = false;
let hasMadeSuggestionThisTurn = false;
let latestPlayers = [];
let pendingGameOver = false;
let playersAtGameStart = 0;
let revealedEliminatedPlayers = new Set();

window.cleanupOldGame = function() {
    if (currentGameCode) {
        socket.emit("leave_game"); 
        currentGameCode = null;
    }
    inGame = false;
    gameOver = false;
    amEliminated = false;
    hasMadeSuggestionThisTurn = false;

    // On reset le statut du panneau Actions pour ne pas garder
    // "Game Over.", "Your turn!", etc. de la partie précédente.
    const gameStatusEl = document.getElementById("gameStatus");
    if (gameStatusEl) gameStatusEl.textContent = "";

    // On vide tous les champs de code pour qu'un ancien code (ex: joinCodeInput
    // rempli lors d'une précédente session) ne soit pas réutilisé par getCode().
    const joinCodeInput = document.getElementById("joinCodeInput");
    if (joinCodeInput) joinCodeInput.value = "";
    const codeInput = document.getElementById("codeInput");
    if (codeInput) codeInput.value = "";
    const setupCodeInput = document.getElementById("setupCodeInput");
    if (setupCodeInput) setupCodeInput.value = "";
    const gameCodeDisplay = document.getElementById("gameCode");
    if (gameCodeDisplay) gameCodeDisplay.textContent = "-";
    
    const btnStartFinal = document.getElementById('btn-start-final');
    if (btnStartFinal) {
        btnStartFinal.disabled = false;
        btnStartFinal.textContent = "CONTINUE INVESTIGATION";
    }
    document.querySelectorAll('input[name="character"]').forEach(r => r.checked = false);
    
    document.getElementById('resultModal')?.classList.add('hidden');
    document.getElementById('authCustomModal')?.style.setProperty('display', 'none');
};


function handleCreateGame() {
    window.cleanupOldGame(); 
    isCreating = true;
    showView('view-create-game');
    const nameInput = document.getElementById('createNameInput');
    if (nameInput && currentUser) {
    nameInput.value = currentUser;
    nameInput.readOnly = true;
    nameInput.style.opacity = "0.6";
    nameInput.style.cursor = "not-allowed";
    } else if (nameInput) {
    nameInput.value = "";
    nameInput.readOnly = false;
    nameInput.style.opacity = "1";
    nameInput.style.cursor = "text";
    }

    const codeSection = document.getElementById('createCodeSection');
    if (codeSection) codeSection.classList.add('hidden');
    const codeDisplay = document.getElementById('createCodeDisplay');
    if (codeDisplay) codeDisplay.textContent = "- - - -";

    const btnGen = document.getElementById('btn-generate-code');
    if (btnGen) {
    btnGen.disabled = false;
    btnGen.textContent = "GENERATE CODE";
    btnGen.style.display = '';
    }
}

function handleJoinGame() {
    window.cleanupOldGame(); 
    isCreating = false;
    showView('view-join-game');
    const nameInput = document.getElementById('joinNameInput');
    if (nameInput && currentUser) {
    nameInput.value = currentUser;
    nameInput.readOnly = true;
    nameInput.style.opacity = "0.6";
    nameInput.style.cursor = "not-allowed";
    } else if (nameInput) {
    nameInput.value = "";
    nameInput.readOnly = false;
    nameInput.style.opacity = "1";
    nameInput.style.cursor = "text";
    }
    const codeInput = document.getElementById('joinCodeInput');
    if (codeInput) codeInput.value = "";
}

let authMode = 'login';
let currentUser = null;

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'signup' : 'login';

    document.getElementById('auth-title').innerText = authMode === 'login' ? 'IDENTIFICATION' : 'NEW REGISTRATION';
    document.getElementById('auth-subtitle').innerText = authMode === 'login'
    ? 'Log in to enter the investigation'
    : 'Register your alias and bureau email';
    document.getElementById('btn-auth-submit').innerText = authMode === 'login' ? 'LOG IN' : 'REGISTER';
    document.getElementById('auth-toggle-text').innerText = authMode === 'login' ? 'New detective?' : 'Already registered?';
    document.getElementById('auth-toggle-link').innerText = authMode === 'login' ? 'Register here' : 'Log in here';

    document.getElementById('auth-email-group').style.display = authMode === 'login' ? 'none' : 'block';
    document.getElementById('forgot-password-container').style.display = authMode === 'login' ? 'block' : 'none';
    document.getElementById('auth-error').innerText = '';
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function updateSettingsProfile() {
    const profileContent = document.getElementById('profile-content');
    const disconnectBtn = document.getElementById('settings-disconnect-btn');

    if (currentUser) {
    profileContent.innerHTML = `
        <span>Detective Name</span>
        <div class="input-gold" style="padding: 10px; background: rgba(255,255,255,0.05);">
        ${currentUser}
        </div>
    `;
    if (disconnectBtn) disconnectBtn.style.display = 'block';
    } else {
    profileContent.innerHTML = `
        <p style="color: #ff4d4d; font-size: 14px; margin-bottom: 10px;">⚠️ No active credentials found.</p>
        <button class="btn-play-gold" onclick="closeSettings(); showView('view-auth');" style="padding: 8px; font-size: 12px;">IDENTIFY YOURSELF</button>
    `;
    if (disconnectBtn) disconnectBtn.style.display = 'none';
    }
}

function getPlayerName() {
    const createName = document.getElementById("createNameInput")?.value.trim();
    const joinName = document.getElementById("joinNameInput")?.value.trim();
    const setupName = document.getElementById("setupNameInput")?.value.trim();
    const authName = currentUser;
    const panelName = document.getElementById("nameInput")?.value.trim();
    return (createName || joinName || setupName || authName || panelName || "Player").slice(0, 16);
}

function getName() {
    return getPlayerName();
}

function getCode() {
    // currentGameCode est la source de vérité dès qu'elle est définie
    // (mise à jour sur game_created et sur join confirmé). Les inputs ne servent
    // QUE de fallback avant que la connexion à une partie soit établie,
    // sinon une valeur résiduelle (ex: joinCodeInput rempli avec un ancien code)
    // peut écraser le code de la partie en cours.
    if (currentGameCode) return currentGameCode;
    const joinCode = document.getElementById("joinCodeInput")?.value.trim().toUpperCase();
    const setupCode = document.getElementById("setupCodeInput")?.value.trim().toUpperCase();
    const panelCode = document.getElementById("codeInput")?.value.trim().toUpperCase();
    return joinCode || setupCode || panelCode || "";
}

async function handleAuthSubmit() {
    const usernameInput = document.getElementById('auth-username').value.trim();
    const passwordInput = document.getElementById('auth-password').value.trim();
    const errorEl = document.getElementById('auth-error');
    errorEl.innerText = '';

    if (!usernameInput || !passwordInput) {
    errorEl.innerText = 'Please enter both alias and access code.';
    return;
    }

    const payload = { username: usernameInput, password: passwordInput };

    if (authMode === 'signup') {
        const email = document.getElementById('auth-email').value.trim();

        if (!email || !validateEmail(email)) {
            errorEl.innerText = "Please enter a valid Bureau Email (ex: name@bureau.com)";
            return;
        }

        if (passwordInput.length < 6) {
            errorEl.innerText = "Access code must be at least 6 characters long.";
            return;
        }

        const hasLetter = /[a-zA-Z]/.test(passwordInput);
        const hasDigit = /[0-9]/.test(passwordInput);
        if (!hasLetter || !hasDigit) {
            errorEl.innerText = "Access code must contain at least one letter and one number.";
            return;
        }

        payload.email = email;
    }

    try {
    const endpoint = authMode === 'login' ? '/api/login' : '/api/signup';
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
        currentUser = data.username;

        const dName = document.getElementById('user-name-display');
        if (dName) dName.innerText = currentUser;

        const dInitial = document.getElementById('user-initial');
        if (dInitial) dInitial.innerText = currentUser.charAt(0).toUpperCase();

        const gName = document.getElementById('game-user-name');
        if (gName) gName.innerText = currentUser;

        const gInitial = document.getElementById('game-user-initial');
        if (gInitial) gInitial.innerText = currentUser.charAt(0).toUpperCase();

        const setupName = document.getElementById('setupNameInput');
        if (setupName) setupName.value = currentUser;

        const hiddenNameInput = document.getElementById('nameInput');
        if (hiddenNameInput) hiddenNameInput.value = currentUser;

        showView('view-game-mode');
    } else {
        errorEl.innerText = data.message || 'Authentication failed.';
    }
    } catch (err) {
    errorEl.innerText = 'Server error. Please try again later.';
    console.error(err);
    }
}

function customAuthPrompt(title, text) {
    return new Promise((resolve) => {
    const modal = document.getElementById("authCustomModal");
    document.getElementById("authModalTitle").innerHTML = title;
    document.getElementById("authModalText").innerHTML = text;

    const inputDiv = document.getElementById("authModalInput");
    inputDiv.style.display = "block";
    inputDiv.value = "";

    document.getElementById("authModalCancel").style.display = "block";
    modal.style.display = "flex";
    inputDiv.focus();

    document.getElementById("authModalOk").onclick = () => {
        modal.style.display = "none";
        resolve(inputDiv.value);
    };
    document.getElementById("authModalCancel").onclick = () => {
        modal.style.display = "none";
        resolve(null);
    };
    });
}

function customAuthAlert(title, text) {
    return new Promise((resolve) => {
    const modal = document.getElementById("authCustomModal");
    document.getElementById("authModalTitle").innerHTML = title;
    document.getElementById("authModalText").innerHTML = text;
    document.getElementById("authModalInput").style.display = "none";
    document.getElementById("authModalCancel").style.display = "none";
    modal.style.display = "flex";
    document.getElementById("authModalOk").onclick = () => {
        modal.style.display = "none";
        resolve();
    };
    });
}

function customAuthConfirm(title, text) {
    return new Promise((resolve) => {
    const modal = document.getElementById("authCustomModal");
    document.getElementById("authModalTitle").innerHTML = title;
    document.getElementById("authModalText").innerHTML = text;
    document.getElementById("authModalInput").style.display = "none";
    document.getElementById("authModalCancel").style.display = "block";
    modal.style.display = "flex";
    document.getElementById("authModalOk").onclick = () => {
        modal.style.display = "none";
        resolve(true);
    };
    document.getElementById("authModalCancel").onclick = () => {
        modal.style.display = "none";
        resolve(false);
    };
    });
}

async function handleRecoverCode() {
    const email = await customAuthPrompt("RECOVER CREDENTIALS", "Enter your Bureau Email:");

    if (!email || email.trim() === "") return;

    if (!validateEmail(email)) {
    await customAuthAlert("ERROR", "Invalid email format.");
    return;
    }

    try {
    const res = await fetch('/api/recover-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    });
    const data = await res.json();

    if (data.success) {
        await customAuthAlert(
        "RECORDS FOUND",
        `Detective: <span style="color:#fcb823">${data.username}</span><br>Access Code: <span style="color:#fcb823">${data.code}</span><br><br>Keep it safe, agent.`
        );
    } else {
        await customAuthAlert("ERROR", data.message);
    }
    } catch (err) {
    await customAuthAlert("ERROR", "Bureau database is currently unreachable.");
    }
}

async function handleQuit() {
    const confirmed = await customAuthConfirm("QUIT INVESTIGATION", "Are you sure you want to abandon the case?");
    if (confirmed) {
    window.cleanupOldGame(); 
    window.close();
    document.body.innerHTML = `
        <div style="position:fixed; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; background: radial-gradient(circle at center, rgba(30, 0, 0, 0.9) 0%, rgba(0, 0, 0, 1) 100%); color:#d4af37; font-family:'Special Elite', cursive; z-index:9999; text-align:center;">
        <div style="border: 2px solid #900025; padding: 60px 100px; background: rgba(10, 2, 0, 0.95); box-shadow: 0 0 50px rgba(144, 0, 37, 0.6), inset 0 0 30px rgba(0,0,0,0.9); border-radius: 12px; position:relative; overflow:hidden;">
            <div style="position:absolute; top:0; left:0; width:100%; height:4px; background:linear-gradient(90deg, transparent, #900025, transparent);"></div>
            <h2 style="font-size: 56px; margin: 0 0 25px 0; color: #b30026; text-shadow: 0 4px 20px rgba(144, 0, 37, 0.8); letter-spacing: 6px; font-weight:900;">INVESTIGATION CLOSED</h2>
            <p style="font-size: 20px; color: rgba(242, 228, 208, 0.7); letter-spacing: 3px; margin: 0;">You may safely close this tab to leave the Bureau.</p>
            <div style="position:absolute; bottom:0; left:0; width:100%; height:4px; background:linear-gradient(90deg, transparent, #900025, transparent);"></div>
        </div>
        </div>
    `;
    }
}

async function disconnect() {
    const confirmed = await customAuthConfirm("DISCONNECT", "Are you sure you want to disconnect from your account?");
    if (confirmed) {
    window.cleanupOldGame(); 

    currentUser = null;

    const nameDisplay = document.getElementById('user-name-display');
    const initialDisplay = document.getElementById('user-initial');
    const profileBadge = document.getElementById('home-user-profile');

    if (nameDisplay) nameDisplay.innerText = "Detective";
    if (initialDisplay) initialDisplay.innerText = "?";
    if (profileBadge) profileBadge.style.display = 'none';

    if (document.getElementById('auth-username')) document.getElementById('auth-username').value = '';
    if (document.getElementById('auth-password')) document.getElementById('auth-password').value = '';
    if (document.getElementById('auth-email')) document.getElementById('auth-email').value = '';
    if (document.getElementById('setupNameInput')) document.getElementById('setupNameInput').value = '';
    if (document.getElementById('nameInput')) document.getElementById('nameInput').value = '';
    if (document.getElementById('createNameInput')) document.getElementById('createNameInput').value = '';
    if (document.getElementById('joinNameInput')) document.getElementById('joinNameInput').value = '';
    if (document.getElementById('joinCodeInput')) document.getElementById('joinCodeInput').value = '';

    closeSettings();
    showView('view-home');
    updateSettingsProfile();
    }
}

function openSettingsFromGame() {
    updateSettingsProfile();
    
    const leaveGroup = document.getElementById('settings-leave-group');
    if (leaveGroup) {
        leaveGroup.style.display = currentGameCode ? 'block' : 'none';
    }
    
    document.getElementById('settings-overlay').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-overlay').classList.add('hidden');
}

function showView(viewId) {
    document.querySelectorAll('.screen-view').forEach(s => {
    s.classList.add('hidden');
    s.classList.remove('active');
    });

    const target = document.getElementById(viewId);
    if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
    }
}

function goToAuth() {
    if (currentUser) {
    showView('view-game-mode');
    } else {
    showView('view-auth');
    }
}

function enterGame() {
    if (!currentUser) {
    showView('view-auth');
    return;
    }
    showView('view-game-mode');
}

function toggleFullscreen() {
    const isChecked = document.getElementById('fullscreen-toggle').checked;
    if (isChecked) {
    (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen || function () { }).call(document.documentElement);
    } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () { }).call(document);
    }
}

function toggleColorblind() {
    document.body.classList.toggle('colorblind-mode', document.getElementById('colorblind-toggle').checked);
}

function toggleMusic() {
    const musicEl = document.getElementById('bg-music');
    const isChecked = document.getElementById('music-toggle').checked;
    if (!musicEl) return;

    if (isChecked) {
    musicEl.play().catch(err => console.log("Audio autoplay bloqué, interaction requise.", err));
    } else {
    musicEl.pause();
    }
}

function updateMusicVolume() {
    const musicEl = document.getElementById('bg-music');
    const volumeSlider = document.getElementById('music-volume');
    if (musicEl && volumeSlider) {
        musicEl.volume = volumeSlider.value;
    }
}

let sfxEnabled = false;
function toggleSfx() {
    const sfxToggle = document.getElementById('sfx-toggle');
    if (sfxToggle) {
        sfxEnabled = sfxToggle.checked;
    }
}

function playSound(name) {
    if (!sfxEnabled) return;
    const audio = new Audio(`assets/audio/${name}.wav`);
    audio.volume = 0.5;
    audio.play().catch(err => {});
}

function playClickSound() {
    playSound('move-step');
}

document.addEventListener('click', function(e) {
    // Play sound when clicking a button or a toggle switch
    if (e.target.closest('button') || e.target.closest('.switch-gold')) {
        playClickSound();
    }
});

// Initialize music volume on load
setTimeout(updateMusicVolume, 100);

const SUSPECTS = ["Scarlet", "Mustard", "White", "Green", "Peacock", "Plum"];
const SUSPECT_DISPLAY = {
    "Scarlet": "Miss Scarlet",
    "Mustard": "Colonel Mustard",
    "White": "Mrs. White",
    "Green": "Mr. Green",
    "Peacock": "Mrs. Peacock",
    "Plum": "Professor Plum"
};
const WEAPONS = ["Knife", "Candlestick", "Revolver", "Rope", "Lead Pipe", "Wrench"];
const ROOMS = ["Kitchen", "Ballroom", "Conservatory", "Dining Room", "Billiard Room", "Library", "Lounge", "Hall", "Study"];

document.querySelectorAll('input[name="character"]').forEach(input => {
    input.addEventListener('change', () => {
    const characterName = input.value;
    const gameCode = getCode();

    if (gameCode && characterName) {
        socket.emit("select_character", {
        gameCode: gameCode,
        characterName: characterName,
        confirm: false
        });
    }
    });
});

const chatInput = document.getElementById("chatInput");
const sendChatBtn = document.getElementById("sendChatBtn");
const chatMessages = document.getElementById("chatMessages");
const status = document.getElementById("status");
const gameStatus = document.getElementById("gameStatus");
const nameInput = document.getElementById("nameInput");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const codeInput = document.getElementById("codeInput");
const gameCodeEl = document.getElementById("gameCode");
const playersEl = document.getElementById("players");
const handEl = document.getElementById("hand");
const suspectSelect = document.getElementById("suspectSelect");
const weaponSelect = document.getElementById("weaponSelect");
const roomSelect = document.getElementById("roomSelect");
const suggestBtn = document.getElementById("suggestBtn");
const accuseBtn = document.getElementById("accuseBtn");
const doorModal = document.getElementById("doorModal");
const doorButtons = document.getElementById("doorButtons");
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const secretPassageBtn = document.getElementById("secretPassageBtn");
const cardChoiceModal = document.getElementById("cardChoiceModal");
const cardChoiceModalText = document.getElementById("cardChoiceModalText");
const cardChoiceButtons = document.getElementById("cardChoiceButtons");
const alertModal = document.getElementById("alertModal");
const alertModalTitle = document.getElementById("alertModalTitle");
const alertModalText = document.getElementById("alertModalText");
const alertModalClose = document.getElementById("alertModalClose");

alertModalClose.onclick = () => {
    alertModal.style.display = "none";
};

function showCustomAlert(title, message) {
    customAuthAlert(title, message);
}

secretPassageBtn.onclick = () => {
    if (secretPassageBtn.disabled) return;
    secretPassageBtn.disabled = true;
    const code = getCode();
    if (!code) return;
    socket.emit("use_secret_passage", { gameCode: code });
};

function setupDpadBtn(btn, direction) {
    btn.onclick = () => {
    if (!btn.disabled) {
        disableDpad();
        socket.emit("move_step", { gameCode: getCode(), direction });
    }
    };
}

setupDpadBtn(btnUp, 'z');
setupDpadBtn(btnDown, 's');
setupDpadBtn(btnLeft, 'q');
setupDpadBtn(btnRight, 'd');

function updateDpad(validDirs) {
    btnUp.disabled = !validDirs.includes('z');
    btnDown.disabled = !validDirs.includes('s');
    btnLeft.disabled = !validDirs.includes('q');
    btnRight.disabled = !validDirs.includes('d');
}

function disableDpad() {
    btnUp.disabled = true;
    btnDown.disabled = true;
    btnLeft.disabled = true;
    btnRight.disabled = true;
}

function fillSelect(selectEl, items) {
    selectEl.innerHTML = "";
    for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    selectEl.appendChild(opt);
    }
}

fillSelect(suspectSelect, SUSPECTS);
fillSelect(weaponSelect, WEAPONS);
fillSelect(roomSelect, ROOMS);

function getGuess() {
    return {
    suspect: suspectSelect.value,
    weapon: weaponSelect.value,
    room: roomSelect.value
    };
}

function setActionButtons({ myTurn, currentRoom = null }) {
    const canAct = !gameOver && !amEliminated;
    suggestBtn.disabled = true;
    accuseBtn.disabled = !(canAct && myTurn);
    document.getElementById("rollDiceBtn").disabled = !(canAct && myTurn);
    document.getElementById("endTurnBtn").disabled = true;
    const hasPassage = canAct && myTurn && ["Kitchen", "Library", "Lounge", "Conservatory"].includes(currentRoom);
    secretPassageBtn.disabled = !hasPassage;
}

const btnGenCode = document.getElementById('btn-generate-code');
if (btnGenCode) {
    btnGenCode.onclick = function () {
    const playerName = getPlayerName();
    if (!playerName || playerName === "Player") {
        showCustomAlert("⚠️ Missing Information", "Please enter your detective name");
        return;
    }
    document.getElementById("nameInput").value = playerName;
    socket.emit("create_game", { name: playerName });
    btnGenCode.textContent = "GENERATING...";
    btnGenCode.disabled = true;
    };
}

const btnContinueCreate = document.getElementById('btn-continue-create');
if (btnContinueCreate) {
    btnContinueCreate.onclick = function () {
    showView('view-character-selection');
    };
}

const btnConfirmJoin = document.getElementById('btn-confirm-join');
if (btnConfirmJoin) {
    btnConfirmJoin.onclick = function () {
    const playerName = getPlayerName();
    const code = document.getElementById('joinCodeInput')?.value.trim().toUpperCase();
    if (!code) {
        showCustomAlert("⚠️ Missing Information", "Please enter a case code");
        return;
    }
    if (!playerName || playerName === "Player") {
        showCustomAlert("⚠️ Missing Information", "Please enter your detective name");
        return;
    }
    currentGameCode = code;
    document.getElementById("nameInput").value = playerName;
    document.getElementById("codeInput").value = code;
    socket.emit("join_game", { gameCode: code, name: playerName });
    };
}

const confirmBtn = document.getElementById('btn-confirm-setup');
if (confirmBtn) {
    confirmBtn.onclick = function () {};
}

const btnStartFinal = document.getElementById('btn-start-final');
if (btnStartFinal) {
    btnStartFinal.onclick = function () {
    const selectedChar = document.querySelector('input[name="character"]:checked');

    if (!selectedChar) {
        showCustomAlert("⚠️ Missing Character", "Please choose a character!");
        return;
    }

    const playerName = getPlayerName();
    const gameCode = getCode();

    btnStartFinal.disabled = true;
    btnStartFinal.textContent = "LOADING...";

    socket.emit("select_character", {
        gameCode: gameCode,
        characterName: selectedChar.value,
        confirm: true
    });
    };
}

socket.on("connect", () => {
    status.textContent = "Connected " + socket.id;
});

socket.on("disconnect", () => {
    status.textContent = "Disconnected";
    // On nettoie l'état local pour qu'un éventuel reconnect ne garde pas
    // un currentGameCode obsolète (qui ferait planter select_character ensuite).
    currentGameCode = null;
    inGame = false;
    gameOver = false;
    amEliminated = false;
    hasMadeSuggestionThisTurn = false;
    showView('view-home');
});

createBtn.onclick = () => {
    gameStatus.textContent = "";
    socket.emit("create_game", { name: getName() });
};

joinBtn.onclick = () => {
    gameStatus.textContent = "";
    const code = getCode();
    if (!code) return;
    socket.emit("join_game", { gameCode: code, name: getName() });
};

startBtn.onclick = () => {
    gameStatus.textContent = "";
    const code = getCode();
    if (!code) return;
    socket.emit("start_game", { gameCode: code });
};

suggestBtn.onclick = () => {
    if (suggestBtn.disabled) return;
    if (hasMadeSuggestionThisTurn) {
        showCustomAlert("⚠️ Error", "You have already made a suggestion this turn!");
        return;
    }
    suggestBtn.disabled = true;
    const code = getCode();
    if (!code) return;
    socket.emit("make_suggestion", { gameCode: code, ...getGuess() });
};

accuseBtn.onclick = () => {
    if (gameOver || amEliminated) return;
    accusationChoice = { suspect: "", weapon: "", room: "" };
    initAccusationModal();
    openGameModal(document.getElementById("accusationModal"));
};

sendChatBtn.onclick = () => {
    const message = chatInput.value.trim();
    if (!message) return;
    socket.emit("chat_message", { gameCode: getCode(), message });
    chatInput.value = "";
};

document.getElementById("rollDiceBtn").onclick = () => {
    const btn = document.getElementById("rollDiceBtn");
    if (btn.disabled) return;
    btn.disabled = true; 
    const code = getCode();
    if (!code) return;
    socket.emit("roll_dice", { gameCode: code });
};

document.getElementById("endTurnBtn").onclick = () => {
    const btn = document.getElementById("endTurnBtn");
    if (btn.disabled) return;
    btn.disabled = true;
    const code = getCode();
    if (!code) return;
    socket.emit("end_turn", { gameCode: code });
};

socket.on("game_created", ({ gameCode }) => {
    currentGameCode = gameCode;
    gameCodeEl.textContent = gameCode;
    codeInput.value = gameCode;
    amEliminated = false;
    gameOver = false;
    inGame = false;
    setActionButtons({ myTurn: false });

    const codeSection = document.getElementById('createCodeSection');
    if (codeSection) codeSection.classList.remove('hidden');

    const codeDisplay = document.getElementById('createCodeDisplay');
    if (codeDisplay) codeDisplay.textContent = gameCode;

    const btnGen = document.getElementById('btn-generate-code');
    if (btnGen) {
    btnGen.disabled = true;
    btnGen.style.display = 'none';
    }
});

socket.on("lobby_update", ({ gameCode, players }) => {
    latestPlayers = players || [];

    currentGameCode = gameCode;
    gameCodeEl.textContent = gameCode;
    codeInput.value = gameCode;

    // On change d'écran SEULEMENT si le serveur nous accepte
    const joinView = document.getElementById('view-join-game');
    if (joinView && joinView.classList.contains('active')) {
        showView('view-character-selection');
    }

    document.querySelectorAll('.character-card').forEach(card => {
    card.classList.remove('taken');
    const radio = card.querySelector('input[type="radio"]');
    if (radio) radio.disabled = false;
    });

    players.forEach(p => {
    if (p.character && p.id !== socket.id) {
        const charValue = p.character.toLowerCase();
        const radio = document.querySelector(`input[name="character"][value="${charValue}"]`);

        if (radio) {
        radio.disabled = true;
        const card = radio.closest('.character-card');
        if (card) card.classList.add('taken');
        if (radio.checked) radio.checked = false;
        }
    }
    });

    playersEl.innerHTML = "";
    players.forEach(p => {
    const li = document.createElement("li");
    const displayName = p.character ? p.character.charAt(0).toUpperCase() + p.character.slice(1) : "Selecting...";
    li.textContent = `${p.name} — Investigating as: ${displayName}` + (p.isHost ? " (Host)" : "");
    playersEl.appendChild(li);
    });

    const playersRow = document.getElementById("playersRow");
    if (playersRow) {
    playersRow.innerHTML = "";
    for (const p of players) {
        const card = document.createElement("div");
        card.className = "playerIcon" +
        (p.id === socket.id ? " playerIconMe" : "") +
        (p.eliminated ? " playerIconElim" : "");

        const initial = document.createElement("div");
        initial.className = "playerInitial";

        if (inGame && p.character) {
            initial.textContent = "";
            const img = document.createElement("img");
            img.src = `assets/ui/suspects/${p.character.toLowerCase()}.png`;
            img.alt = p.character;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.borderRadius = "50%";
            img.style.objectFit = "cover";
            img.style.objectPosition = "center top";
            initial.style.paddingTop = "0";
            initial.appendChild(img);
        } else {
            initial.textContent = p.name.charAt(0).toUpperCase();
        }

        const name = document.createElement("div");
        name.className = "playerName";
        name.textContent = p.name.slice(0, 8);

        const badges = document.createElement("div");
        badges.className = "playerBadges";

        if (p.isHost) {
        const host = document.createElement("span");
        host.className = "badgeHost";
        host.textContent = "host";
        initial.appendChild(host);
        }

        if (p.eliminated) {
        const elim = document.createElement("span");
        elim.className = "badgeElim";
        elim.textContent = "OUT";
        badges.appendChild(elim);
        }

        card.appendChild(initial);
        card.appendChild(name);
        card.appendChild(badges);
        playersRow.appendChild(card);
    }

    const startBtnEl = document.getElementById("startBtn");
    const me = players.find(p => p.id === socket.id);
    if (startBtnEl) {
        startBtnEl.style.display = (me?.isHost && !inGame) ? "block" : "none";
    }
    }
});

socket.on("your_hand", ({ hand }) => {
    resetNotebookState();
    
    showView('view-game');
    inGame = true;
    playersAtGameStart = latestPlayers.filter(p => !p.eliminated).length;
    gameStatus.textContent = "Game started. Cards dealt.";
    handEl.innerHTML = "";
    gameOver = false;
    amEliminated = false;
    hasMadeSuggestionThisTurn = false;
    markHandCardsAsImpossible(hand);
    for (const card of hand) {
    const [type, name] = card.split(": ");
    const folder = type === "Suspect" ? "suspects" : type === "Weapon" ? "weapons" : "rooms";
    const filename = name.toLowerCase().replace(/ /g, "-") + ".png";
    const displayName = type === "Suspect" ? (SUSPECT_DISPLAY[name] || name) : name;
    const div = document.createElement("div");
    div.className = "hand-card";
    div.innerHTML = `<img src="assets/ui/${folder}/${filename}" alt="${displayName}" /><span>${displayName}</span>`;
    handEl.appendChild(div);
    }
    setActionButtons({ myTurn: false });
});

function normalizeNotebookCardName(type, name) {
    if (!type || !name) return null;

    const cleanType = type.trim();
    const cleanName = name.trim();

    if (cleanType === "Suspect") {
        return Object.keys(SUSPECT_DISPLAY).find(
            key => key.trim().toLowerCase() === cleanName.toLowerCase()
                || (SUSPECT_DISPLAY[key] || "").trim().toLowerCase() === cleanName.toLowerCase()
        ) || cleanName;
    }

    return cleanName;
}

function markCardsAsRuledOut(cards) {
    if (!Array.isArray(cards)) return;

    cards.forEach((card) => {
        const [type, name] = card.split(": ");
        const notebookName = normalizeNotebookCardName(type, name);

        if (notebookName) {
            notebookState[notebookName] = "impossible";
        }
    });

    initNotebook();
    initAccusationModal();
}

socket.on("ask_exit_door", () => {
    if (doorModal) {
        doorModal.style.display = "none";
    }

    if (doorButtons) {
        doorButtons.innerHTML = "";
    }
});

socket.on("dice_rolled", ({ playerId, value, validDirs }) => {
    playSound('dice-roll');
    if (playerId === socket.id) {
        gameStatus.textContent = `Moves left: ${value}`;
        document.getElementById("rollDiceBtn").disabled = true;
        secretPassageBtn.disabled = true;
        suggestBtn.disabled = true;
        document.getElementById("endTurnBtn").disabled = true;
        updateDpad(validDirs || []);
    }
});

socket.on("chat_message", ({ playerName, message }) => {
    const div = document.createElement("div");
    div.textContent = playerName + ": " + message;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    incrementChatBadge();
});

socket.on("turn_update", ({ currentPlayerId, currentRoom, wasSummoned }) => {
    playSound('turn-change');
    const myTurn = socket.id === currentPlayerId;
    if (myTurn) hasMadeSuggestionThisTurn = false;
    setActionButtons({ myTurn, currentRoom });
    if (gameOver) return;
    if (amEliminated) {
    gameStatus.textContent = "You are eliminated.";
    return;
    }
    if (myTurn) {
    gameStatus.textContent = "Your turn!";
    if (wasSummoned && currentRoom) {
        suggestBtn.disabled = false;
        gameStatus.textContent = "Your turn! You were summoned here, you can suggest right away!";
    }
    } else {
    gameStatus.textContent = "Waiting for other player…";
    }
});

socket.on("suggestion_made", ({ byPlayerId, suspect, weapon, room }) => {
    playSound('suggestion');
    if (!gameOver) gameStatus.textContent = `Suggestion: ${suspect} / ${weapon} / ${room}`;
    if (socket.id === byPlayerId) {
    hasMadeSuggestionThisTurn = true;
    document.getElementById("rollDiceBtn").disabled = true;
    secretPassageBtn.disabled = true;
    suggestBtn.disabled = true;
    document.getElementById("endTurnBtn").disabled = true;
    accuseBtn.disabled = true;
    }
});

socket.on("waiting_for_disprove", () => {
    if (!gameOver) gameStatus.textContent = "Waiting for someone to disprove…";
});

socket.on("you_must_disprove", ({ gameCode, options, suggesterName, suspect, weapon, room }) => {
    cardChoiceModalText.innerHTML = `<b>${suggesterName}</b> suggested:<br/><i>${suspect} with the ${weapon} in the ${room}</i><br/><br/>Which card do you want to show them?`;
    cardChoiceButtons.innerHTML = "";
    options.forEach(card => {
    const btn = document.createElement("button");
    btn.textContent = card;
    btn.style.cssText = "padding: 10px 20px; font-size: 16px; cursor: pointer;";
    btn.onclick = () => {
        if (btn.disabled) return;
        btn.disabled = true;
        cardChoiceModal.style.display = "none";
        socket.emit("disprove", { gameCode, card });
    };
    cardChoiceButtons.appendChild(btn);
    });
    cardChoiceModal.style.display = "flex";
});

socket.on("card_revealed", ({ card, fromPlayerName }) => {
    playSound('card-reveal');
    if (gameOver) return;
    gameStatus.textContent = "Evidence found!";
    showCustomAlert("🔍 Evidence Found!", `You were shown: <b>${card}</b><br/>by ${fromPlayerName}`);
    document.getElementById("endTurnBtn").disabled = false;
    accuseBtn.disabled = false;
});

socket.on("no_one_disproved", ({ suggesterId, suggesterName, suspect, weapon, room }) => {
    if (!gameOver) gameStatus.textContent = "No one could disprove.";
    if (socket.id === suggesterId) {
    showCustomAlert("❌ No Evidence", "No cards were shown to you.<br/>No one could disprove your suggestion!");
    document.getElementById("endTurnBtn").disabled = false;
    accuseBtn.disabled = false;
    } else {
    showCustomAlert("📝 Interesting...", `<b>${suggesterName}</b> suggested:<br/><i>${suspect} with the ${weapon} in the ${room}</i><br/><br/><b>No one could disprove it!</b>`);
    }
});

socket.on("someone_disproved", ({ responderId, responderName, suggesterId, suggesterName, suspect, weapon, room }) => {
    playSound('card-reveal');
    if (!gameOver) gameStatus.textContent = "Someone disproved.";
    if (socket.id !== responderId && socket.id !== suggesterId) {
    showCustomAlert("👀 Secret Exchange", `<b>${suggesterName}</b> suggested:<br/><i>${suspect} with the ${weapon} in the ${room}</i><br/><br/><b>${responderName}</b> showed them a card secretly!`);
    }
});

const SUSPECT_IMG = { Scarlet: "scarlet", Mustard: "mustard", White: "white", Green: "green", Peacock: "peacock", Plum: "plum" };
const WEAPON_IMG = { Knife: "knife", Candlestick: "candlestick", Revolver: "revolver", Rope: "rope", "Lead Pipe": "lead-pipe", Wrench: "wrench" };
const ROOM_IMG = { Kitchen: "kitchen", Ballroom: "ballroom", Conservatory: "conservatory", "Dining Room": "dining-room", "Billiard Room": "billiard-room", Library: "library", Lounge: "lounge", Hall: "hall", Study: "study" };

// Différencier victoire normale d'une victoire par abandon/forfait
function showResultModal(isVictory, solution, lastManStanding = false, didIAccuseWrong = false) {
    const modal = document.getElementById("resultModal");
    const inner = document.getElementById("resultModalInner");
    const title = document.getElementById("resultTitle");
    const subtitle = document.getElementById("resultSubtitle");
    const sentence = document.getElementById("resultSentence");

    const s = solution.suspect;
    const w = solution.weapon;
    const r = solution.room;

    document.getElementById("resultSuspectImg").src = `assets/ui/suspects/${SUSPECT_IMG[s] || s.toLowerCase()}.png`;
    document.getElementById("resultWeaponImg").src = `assets/ui/weapons/${WEAPON_IMG[w] || w.toLowerCase()}.png`;
    document.getElementById("resultRoomImg").src = `assets/ui/rooms/${ROOM_IMG[r] || r.toLowerCase().replace(/ /g, "-")}.png`;
    document.getElementById("resultSuspectLabel").textContent = s.toUpperCase();
    document.getElementById("resultWeaponLabel").textContent = w.toUpperCase();
    document.getElementById("resultRoomLabel").textContent = r.toUpperCase();

    if (isVictory) {
        inner.className = "result-modal result-modal--victory";
        title.textContent = "CONGRATULATIONS!";

        if (lastManStanding) {
            subtitle.textContent = "YOU WON THE GAME!";
            sentence.innerHTML = `YOU ARE THE LAST DETECTIVE STANDING. THE SOLUTION WAS <strong>${s.toUpperCase()}</strong> WITH THE <strong>${w.toUpperCase()}</strong> IN THE <strong>${r.toUpperCase()}</strong>.`;
        } else {
            subtitle.textContent = "YOU MADE THE CORRECT ACCUSATION!";
            sentence.innerHTML = `IT WAS <strong>${s.toUpperCase()}</strong> WITH THE <strong>${w.toUpperCase()}</strong> IN THE <strong>${r.toUpperCase()}</strong>!`;
        }
    } else {
        inner.className = "result-modal result-modal--defeat";
        title.textContent = "GAME OVER!";

        if (didIAccuseWrong) {
            subtitle.textContent = "YOU MADE THE WRONG ACCUSATION!";
            sentence.innerHTML = `IT WAS <span class="not-word"><strong>NOT</strong></span> <strong>${s.toUpperCase()}</strong> WITH THE <strong>${w.toUpperCase()}</strong> IN THE <strong>${r.toUpperCase()}</strong>!`;
        } else if (lastManStanding) {
            subtitle.textContent = "ANOTHER PLAYER WON THE GAME!";
            sentence.innerHTML = `THE SOLUTION WAS <strong>${s.toUpperCase()}</strong> WITH THE <strong>${w.toUpperCase()}</strong> IN THE <strong>${r.toUpperCase()}</strong>.`;
        } else {
            subtitle.textContent = "ANOTHER DETECTIVE SOLVED THE CASE!";
            sentence.innerHTML = `THE SOLUTION WAS <strong>${s.toUpperCase()}</strong> WITH THE <strong>${w.toUpperCase()}</strong> IN THE <strong>${r.toUpperCase()}</strong>.`;
        }
    }

    modal.classList.remove("hidden");
}

socket.on("game_won", ({ winnerId, solution, lastManStanding }) => {
    pendingGameOver = true;
    gameOver = true;

    playSound('accusation');
    setActionButtons({ myTurn: false });
    gameStatus.textContent = "Game Over.";
    showResultModal(winnerId === socket.id, solution, lastManStanding, false);
});

socket.on("accusation_wrong", ({ message, solution }) => {
    pendingGameOver = true;
    playSound('accusation');
    if (solution) {
    showResultModal(false, solution, false, true);
    } else {
    showCustomAlert("💀 Eliminated", message);
    }
});

socket.on("wrong_accusation_cards", ({ playerId, playerName, cards }) => {
    if (playerId === socket.id) return;

    // Si la partie est déjà terminée, on ne montre rien
    if (gameOver || playersAtGameStart <= 2) return; 
    
    revealedEliminatedPlayers.add(playerId);
    
    markCardsAsRuledOut(cards);

    const cardsText = cards
        .map((card) => {
            const [type, name] = card.split(": ");
            const displayName =
                type === "Suspect" ? (SUSPECT_DISPLAY[name] || name) : name;
            return `• ${displayName}`;
        })
        .join("<br>");

    showCustomAlert(
        "🔎 Cards Revealed",
        `<b>${playerName}</b> made a wrong accusation and is eliminated!<br><br>
        Their cards have been revealed and marked as <b>Ruled Out</b> in your notebook:<br><br>
        ${cardsText}`
    );
});

socket.on("already_suggested_this_turn", () => {
    hasMadeSuggestionThisTurn = true;
    showCustomAlert("⚠️ Error", "You have already made a suggestion this turn!");
});

socket.on("error_msg", ({ message }) => {
    showCustomAlert("⚠️ Error", message);
    
    const me = socket.id;
    if (message.includes("You must roll the dice")) {
        document.getElementById("rollDiceBtn").disabled = false;
        suggestBtn.disabled = false;
    } else if (message.includes("You have already rolled")) {
        // do nothing
    } else if (message.includes("Cannot end turn")) {
        document.getElementById("endTurnBtn").disabled = false;
    } else if (message.includes("finish your trips")) {
         document.getElementById("rollDiceBtn").disabled = true;
    }
});

socket.on("player_eliminated", ({ playerId }) => {
    playSound('accusation');
    if (playerId === socket.id) {
    amEliminated = true;
    setActionButtons({ myTurn: false });
    gameStatus.textContent = "You are eliminated.";
    }
});

socket.on("player_disconnected_cards", ({ playerId, playerName, cards }) => {
    if (gameOver || pendingGameOver || playersAtGameStart <= 2) return;

    // Si ce joueur a déjà eu ses cartes révélées après une mauvaise accusation,
    // on ne réaffiche pas le popup à sa déconnexion.
    if (revealedEliminatedPlayers.has(playerId)) return;

    markDisconnectedCardsAsImpossible(cards);

    const cardsText = cards
        .map((card) => {
            const [type, name] = card.split(": ");
            const displayName = type === "Suspect" ? (SUSPECT_DISPLAY[name] || name) : name;
            return `• ${displayName}`;
        })
        .join("<br>");

    showCustomAlert(
        "📌 Player left",
        `<b>${playerName}</b> left the game.<br><br>
        Their cards have been marked as <b>Ruled Out</b> in your notebook:<br><br>
        ${cardsText}`
    );
});

socket.on("player_moved", ({ playerId, pos, remainingMoves, inRoom, validDirs }) => {
    playSound('move-step');
    if (inRoom) playSound('room-entry');

    if (playerId !== socket.id) return;

    if (remainingMoves > 0) {
    gameStatus.textContent = `Moves left: ${remainingMoves}`;
    if (validDirs && validDirs.length === 0) {
        gameStatus.textContent += " (You are blocked!)";
        document.getElementById("endTurnBtn").disabled = false;
    } else {
        document.getElementById("endTurnBtn").disabled = true;
    }
    updateDpad(validDirs || []);
    } else {
    gameStatus.textContent = "Movement finished. Make a suggestion or end turn.";
    document.getElementById("rollDiceBtn").disabled = true;
    secretPassageBtn.disabled = true;
    document.getElementById("endTurnBtn").disabled = false;
    disableDpad();
    if (inRoom) suggestBtn.disabled = false;
    }
});

socket.on("character_selected", ({ success, message }) => {
    if (success) {
    showView('view-game');
    } else {
    showCustomAlert("⚠️ Error", message || "Character selection failed.");
    const btnStartFinal = document.getElementById('btn-start-final');
    if (btnStartFinal) {
        btnStartFinal.disabled = false;
        btnStartFinal.textContent = "CONTINUE INVESTIGATION";
    }
    const selectedChar = document.querySelector('input[name="character"]:checked');
    if (selectedChar) selectedChar.checked = false;
    }
});

function openGameModal(modal) {
    if (modal) modal.classList.remove("hidden");
}

function closeGameModal(modal) {
    if (modal) modal.classList.add("hidden");
}

document.querySelectorAll(".closeModalBtn[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
    const modal = document.getElementById(btn.getAttribute("data-close"));
    closeGameModal(modal);
    });
});

[document.getElementById("notebookModal"), document.getElementById("accusationModal")].forEach((modal) => {
    modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeGameModal(modal);
    });
});

const NOTE_STATUS_ORDER = ["unknown", "possible", "impossible", "confirmed"];
const NOTE_STATUS_SYMBOL = {
    unknown: "—",
    possible: "?",
    impossible: "✕",
    confirmed: "✓"
};
const notebookState = {};

function resetNotebookState() {
    Object.keys(notebookState).forEach((key) => {
        delete notebookState[key];
    });
    initNotebook();
}

function normalizeNotebookCardName(type, name) {
    if (type === "Suspect") {
        return Object.keys(SUSPECT_DISPLAY).find(key => SUSPECT_DISPLAY[key] === name) || name;
    }
    return name;
}

function markHandCardsAsImpossible(hand) {
    if (!Array.isArray(hand)) return;

    hand.forEach((card) => {
        const [type, name] = card.split(": ");
        const notebookName = normalizeNotebookCardName(type, name);

        if (notebookName) {
            notebookState[notebookName] = "impossible";
        }
    });

    initNotebook();
}

function markDisconnectedCardsAsImpossible(cards) {
    if (!Array.isArray(cards)) return;

    cards.forEach((card) => {
        const [type, name] = card.split(": ");
        const notebookName = normalizeNotebookCardName(type, name);

        if (notebookName) {
            notebookState[notebookName] = "impossible";
        }
    });

    initNotebook();
}

function buildNotebookSection(container, items) {
    if (!container) return;
    container.innerHTML = "";

    items.forEach((item) => {
    if (!notebookState[item]) notebookState[item] = "unknown";

    const btn = document.createElement("button");
    btn.className = "noteItem";
    btn.dataset.item = item;
    btn.dataset.status = notebookState[item];

    const label = document.createElement("span");
    label.textContent = SUSPECT_DISPLAY[item] || item;

    const statusIcon = document.createElement("span");
    statusIcon.className = "noteStatus";
    statusIcon.textContent = NOTE_STATUS_SYMBOL[notebookState[item]];

    btn.appendChild(label);
    btn.appendChild(statusIcon);

    btn.addEventListener("click", () => {
        const idx = NOTE_STATUS_ORDER.indexOf(notebookState[item] || "unknown");
        const next = NOTE_STATUS_ORDER[(idx + 1) % NOTE_STATUS_ORDER.length];
        notebookState[item] = next;
        btn.dataset.status = next;
        statusIcon.textContent = NOTE_STATUS_SYMBOL[next];
    });

    container.appendChild(btn);
    });
}

function initNotebook() {
    buildNotebookSection(document.getElementById("notebookSuspects"), SUSPECTS);
    buildNotebookSection(document.getElementById("notebookWeapons"), WEAPONS);
    buildNotebookSection(document.getElementById("notebookRooms"), ROOMS);
}

document.getElementById("openNotebookBtn")?.addEventListener("click", () => {
    openGameModal(document.getElementById("notebookModal"));
});

let accusationChoice = { suspect: "", weapon: "", room: "" };
const confirmAccusationBtn = document.getElementById("confirmAccusationBtn");
const confirmSuggestBtn = document.getElementById("confirmSuggestBtn");

function safeSlug(s) {
    return s.toLowerCase().replace(/\s+/g, "-");
}

const accImgPath = {
    suspect: (name) => `assets/ui/suspects/${safeSlug(name)}.png`,
    weapon: (name) => `assets/ui/weapons/${safeSlug(name)}.png`,
    room: (name) => `assets/ui/rooms/${safeSlug(name)}.png`,
};

function buildAccusationChoices(container, items, type) {
    if (!container) return;
    container.innerHTML = "";

    items.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "accusationChoice";
    btn.dataset.type = type;

    const isRuledOut = notebookState[item] === "impossible";

    if (isRuledOut) {
        btn.classList.add("ruled-out");
    }

    const img = document.createElement("div");
    img.className = "acc-img";
    img.style.backgroundImage = `url("${accImgPath[type](item)}")`;

    const label = document.createElement("span");
    label.textContent = type === "suspect" ? (SUSPECT_DISPLAY[item] || item) : item;

    btn.appendChild(img);
    btn.appendChild(label);

    btn.addEventListener("click", () => {        
        accusationChoice[type] = item;
        [...container.children].forEach((el) => el.classList.remove("selected"));
        btn.classList.add("selected");
        updateAccusationConfirmState();
    });

    container.appendChild(btn);
    });
}

function updateAccusationConfirmState() {
    const ready = !!(accusationChoice.suspect && accusationChoice.weapon && accusationChoice.room);
    if (confirmAccusationBtn) confirmAccusationBtn.disabled = !ready;
    if (confirmSuggestBtn) confirmSuggestBtn.disabled = !ready;
}

function initAccusationModal() {
    buildAccusationChoices(document.getElementById("accusationSuspects"), SUSPECTS, "suspect");
    buildAccusationChoices(document.getElementById("accusationWeapons"), WEAPONS, "weapon");
    buildAccusationChoices(document.getElementById("accusationRooms"), ROOMS, "room");
    updateAccusationConfirmState();
}

document.getElementById("openAccusationBtn")?.addEventListener("click", () => {
    if (gameOver || amEliminated) return;
    accusationChoice = { suspect: "", weapon: "", room: "" };
    initAccusationModal();
    openGameModal(document.getElementById("accusationModal"));
});

confirmSuggestBtn?.addEventListener("click", () => {
    if (confirmSuggestBtn.disabled) return;
    confirmSuggestBtn.disabled = true;
    if (!accusationChoice.suspect || !accusationChoice.weapon || !accusationChoice.room) return;
    const code = getCode();
    if (!code) return;
    socket.emit("make_suggestion", {
    gameCode: code,
    suspect: accusationChoice.suspect,
    weapon: accusationChoice.weapon,
    room: accusationChoice.room,
    });
    closeGameModal(document.getElementById("accusationModal"));
});

confirmAccusationBtn?.addEventListener("click", () => {
    if (confirmAccusationBtn.disabled) return;
    confirmAccusationBtn.disabled = true;
    if (!accusationChoice.suspect || !accusationChoice.weapon || !accusationChoice.room) return;
    const code = getCode();
    if (!code) return;
    socket.emit("make_accusation", {
    gameCode: code,
    suspect: accusationChoice.suspect,
    weapon: accusationChoice.weapon,
    room: accusationChoice.room,
    });
    closeGameModal(document.getElementById("accusationModal"));
});

initNotebook();

const chatPanel = document.getElementById("chatPanel");
const chatToggleBtn = document.getElementById("chatToggleBtn");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatBadge = document.getElementById("chatBadge");
const emojiPicker = document.getElementById("emojiPicker");
const emojiToggleBtn = document.getElementById("emojiToggleBtn");

let unreadCount = 0;

function incrementChatBadge() {
    if (!chatPanel.classList.contains("chatPanelHidden")) return;
    unreadCount++;
    chatBadge.textContent = unreadCount;
    chatBadge.classList.remove("hidden");
}

function resetChatBadge() {
    unreadCount = 0;
    chatBadge.classList.add("hidden");
}

chatToggleBtn?.addEventListener("click", () => {
    chatPanel.classList.toggle("chatPanelHidden");

    if (!chatPanel.classList.contains("chatPanelHidden")) {
        resetChatBadge();
        document.body.classList.add("chat-open");
    } else {
        document.body.classList.remove("chat-open");
    }
});

if (emojiPicker) {
    const emojis = emojiPicker.textContent.trim().split(/\s+/);
    emojiPicker.innerHTML = "";
    emojis.forEach(emoji => {
    const span = document.createElement("span");
    span.textContent = emoji;
    span.addEventListener("click", () => {
        chatInput.value += emoji;
        chatInput.focus();
    });
    emojiPicker.appendChild(span);
    });
}

emojiToggleBtn?.addEventListener("click", () => {
    emojiPicker.classList.toggle("hidden");
});

chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
    e.preventDefault();
    sendChatBtn.click();
    }
});

closeChatBtn?.addEventListener("click", () => {
    chatPanel.classList.add("chatPanelHidden");
    document.body.classList.remove("chat-open");
});

window.addEventListener("keydown", (e) => {
    if (!e.key || e.repeat) return; 
    if (document.activeElement === document.getElementById("chatInput")) return;
    const keys = {
    "arrowup": "z", "z": "z", "w": "z",
    "arrowdown": "s", "s": "s",
    "arrowleft": "q", "q": "q", "a": "q",
    "arrowright": "d", "d": "d"
    };
    const direction = keys[e.key.toLowerCase()];
    if (direction) {
        const btnMap = { 'z': btnUp, 's': btnDown, 'q': btnLeft, 'd': btnRight };
        if (btnMap[direction] && !btnMap[direction].disabled) {
            disableDpad();
            socket.emit("move_step", { gameCode: getCode(), direction });
        }
    }
});

/* ─── Fix panneau "Your Hand" en mode compact ───────────────────────────────
   On observe l'attribut data-mobile-panel sur #rightPanel via MutationObserver.
   Dès qu'il passe à "hand", on force les styles inline sur les cartes.
   Cela contourne le stopPropagation() du listener capture d'index.html.
──────────────────────────────────────────────────────────────────────────── */
(function () {
  function fixHandPanel() {
    const hand    = document.getElementById('hand');
    const section = document.getElementById('handPanelSection');
    if (!hand || !section) return;

    section.style.display = 'block';

    Object.assign(hand.style, {
      display              : 'grid',
      gridTemplateColumns  : 'repeat(3, minmax(0, 1fr))',
      gridAutoRows         : 'auto',
      width                : '100%',
      height               : 'auto',
      overflow             : 'visible',
      gap                  : '0.375rem',
    });

    hand.querySelectorAll('.hand-card').forEach(card => {
      Object.assign(card.style, {
        display       : 'flex',
        flexDirection : 'column',
        minHeight     : '0',
        overflow      : 'hidden',
      });
      const img = card.querySelector('img');
      if (img) {
        Object.assign(img.style, {
          width       : '100%',
          height      : 'auto',
          aspectRatio : '3 / 4',
          objectFit   : 'contain',
          flex        : 'none',
        });
      }
    });

    // Reposionner le panneau après que les cartes ont leurs vraies dimensions
    if (typeof positionMobilePanelNearIcon === 'function') {
      requestAnimationFrame(() => positionMobilePanelNearIcon('hand'));
    }
  }

  function initHandPanelObserver() {
    const panel = document.getElementById('rightPanel');
    if (!panel) return;

    new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-mobile-panel') {
          if (panel.getAttribute('data-mobile-panel') === 'hand') {
            // 2 frames : laisser toggleMobilePanel finir son positionnement
            requestAnimationFrame(() => requestAnimationFrame(fixHandPanel));
          }
        }
      }
    }).observe(panel, { attributes: true, attributeFilter: ['data-mobile-panel'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHandPanelObserver);
  } else {
    initHandPanelObserver();
  }
})();

/* ─── Restaurer le panneau droit quand on repasse en desktop ─────────────────
   Le JS inline dans index.html pose des style.display sur les sections du
   panneau. Quand la fenêtre redevient > 1200px, ces styles persistent et
   cassent l'affichage desktop. On les efface ici.
──────────────────────────────────────────────────────────────────────────── */
(function () {
  let prevWidth = window.innerWidth;

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const wasCompact = prevWidth <= 1200;
    const isDesktop  = w > 1200;

    if (wasCompact && isDesktop) {
      // Effacer tous les styles inline posés par toggleMobilePanel
      ['players', 'actions', 'hand'].forEach(name => {
        const section = document.getElementById(name + 'PanelSection');
        if (section) section.style.removeProperty('display');
      });
      // Fermer le panneau mobile s'il était ouvert
      if (typeof closeMobilePanel === 'function') closeMobilePanel();
    }

    prevWidth = w;
  });
})();