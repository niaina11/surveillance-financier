const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../../utils/response');

exports.mesNotifications = async (req, res) => {
    try {
        const id_utilisateur = req.user.id_utilisateur;

        const notifications = await prisma.notification.findMany({
            where: { id_utilisateur, lu: false },
            orderBy: { createdAt: 'desc' },
            take: 30
        });

        return success(res, 200, "Notifications", notifications);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.marquerCommeLue = async (req, res) => {
    try {
        const { id_notification } = req.params;
        const id_utilisateur = req.user.id_utilisateur;

        const notif = await prisma.notification.findUnique({ where: { id_notification } });

        if (!notif) return error(res, 404, "Notification introuvable");
        if (notif.id_utilisateur !== id_utilisateur) return error(res, 403, "Accès refusé");

        const updated = await prisma.notification.update({
            where: { id_notification },
            data: { lu: true }
        });

        return success(res, 200, "Notification marquée comme lue", updated);
    } catch (err) {
        return error(res, 500, err.message);
    }
};