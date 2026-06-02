const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const { createGameModule } = require("./game");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

const USERS_FILE = path.join(__dirname, "users.json");

function getUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, "utf8");
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ success: false, message: "Missing fields" });
    
    const users = getUsers();
    const normalizedUsername = username.toLowerCase();
    
    // On vérifie avec la casse exacte (anciens comptes) et normalisée (nouveaux comptes)
    const userFound = users[username] || users[normalizedUsername];

    if (userFound && userFound.password === password) {
        res.json({ success: true, username: userFound.username });
    } else {
        res.json({ success: false, message: "Invalid credentials" });
    }
});

app.post("/api/signup", (req, res) => {
    const { username, password, email } = req.body;

    // vérification si un des champs est vide
    if (!username || !password || !email || email.trim() === "") {
        return res.json({
            success: false,
            message: "Missing credentials. Detective alias, Email and Access Code are required."
        });
    }

    // Validation du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.json({
            success: false,
            message: "Please enter a valid Bureau Email (ex: name@bureau.com)."
        });
    }

    // Validation du mot de passe (6 caractères min, au moins une lettre et un chiffre)
    if (password.length < 6) {
        return res.json({
            success: false,
            message: "Access code must be at least 6 characters long."
        });
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (!hasLetter || !hasDigit) {
        return res.json({
            success: false,
            message: "Access code must contain at least one letter and one number."
        });
    }

    const users = getUsers();
    const normalizedUsername = username.toLowerCase();

    if (users[normalizedUsername]) {
        return res.json({ success: false, message: "This alias is already taken." });
    }

    // Si tout est bon, on enregistre
    users[normalizedUsername] = { username, password, email };
    saveUsers(users);
    res.json({ success: true, username });
});
// permet de récupérer le code d'accès
app.post("/api/recover-code", (req, res) => {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Email is required for recovery." });

    const users = getUsers();

    // On cherche l'entrée qui possède cet email
    const userFound = Object.values(users).find(u =>
        u.email && u.email.toLowerCase() === email.toLowerCase()
    );

    if (userFound) {
        // On renvoie le pseudo et le code
        res.json({
            success: true,
            username: userFound.username,
            code: userFound.password
        });
    } else {
        res.json({ success: false, message: "No detective found with this email in our records." });
    }
});
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Plug in all socket/game logic (create/join/start/etc)
createGameModule(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
