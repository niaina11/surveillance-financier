const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Crée une notification en base ET l'émet en temps réel via Socket.IO
 * @param {object} io - instance Socket.IO (req.app.get('io'))
 * @param {object} params
 */
exports.notifierUtilisateur = async (io, { id_utilisateur, titre, message, type, id_operation, id_alerte }) => {
    const notification = await prisma.notification.create({
        data: { id_utilisateur, titre, message, type, id_operation, id_alerte }
    });

    io.to(`user:${id_utilisateur}`).emit('nouvelle_notification', notification);

    return notification;
};

exports.notifierAdmins = async (io, { titre, message, type, id_operation, id_alerte }) => {
    const admins = await prisma.utilisateur.findMany({ where: { role: 'ADMIN' } });

    const notifications = await Promise.all(
        admins.map(admin =>
            prisma.notification.create({
                data: { id_utilisateur: admin.id_utilisateur, titre, message, type, id_operation, id_alerte }
            })
        )
    );

    // On émet la première notification créée (elles ont toutes le même contenu, juste id_utilisateur diffère)
    // Chaque admin connecté recevra un objet avec un id_notification valide et propre à lui
    admins.forEach((admin, i) => {
        io.to(`user:${admin.id_utilisateur}`).emit('nouvelle_notification', notifications[i]);
    });

    return notifications;
};