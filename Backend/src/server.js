const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token manquant"));
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'votre_cle_secrete_icisdsdhzuagfjfbs_sdbs'
        );
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error("Token invalide"));
    }
});

io.on('connection', (socket) => {
    const { id_utilisateur, role, id_agence } = socket.user;

    // ─── Rooms existantes (notifications) ────────────────────────────────────
    socket.join(`user:${id_utilisateur}`);
    if (role === 'ADMIN') socket.join('admins');
    if (id_agence) socket.join(`agence:${id_agence}`);

    console.log(`🔌 Socket connecté : ${id_utilisateur} (${role})`);

    // ─── ✅ NOUVEAU : Messagerie ──────────────────────────────────────────────

    // Rejoindre les rooms de conversations
    socket.on('join_conversations', (conversationIds) => {
        conversationIds.forEach(id => {
            socket.join(`conv_${id}`);
        });
    });

    // Quitter une conversation
    socket.on('leave_conversation', (id_conversation) => {
        socket.leave(`conv_${id_conversation}`);
    });

    // Indicateur "en train d'écrire"
    socket.on('typing', ({ id_conversation }) => {
        socket.to(`conv_${id_conversation}`).emit('user_typing', {
            id_utilisateur,
            nom: socket.user.nom,
            prenom: socket.user.prenom
        });
    });

    // Arrêt de frappe
    socket.on('stop_typing', ({ id_conversation }) => {
        socket.to(`conv_${id_conversation}`).emit('user_stop_typing', {
            id_utilisateur
        });
    });

    // ─── Déconnexion ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
        console.log(`🔌 Socket déconnecté : ${id_utilisateur}`);
    });
});

app.set('io', io);

server.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});