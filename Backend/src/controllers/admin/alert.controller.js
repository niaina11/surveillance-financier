const { PrismaClient } = require("@prisma/client");
const { error, success } = require("../../utils/response");
const prisma = new PrismaClient();

const checkAdmin = async (id_utilisateur) => {
    const user = await prisma.utilisateur.findUnique({
        where: {
            id_utilisateur
        }
    });

    if (!user || user.role !== "ADMIN") {
        throw new Error("Accès Admin requis");
    }

    return user;
};

exports.saveAlert = async ({
    type_alerte,
    message,
    id_agence,
    statut
}) => {
    try {
        return await prisma.alerte.create({
            data: {
                type_alerte,
                message,
                id_agence,
                statut
            }
        });
    } catch (err) {
        console.error("Erreur Alert :", err.message);
        throw err;
    }
};

exports.getAlertes = async (req, res) => {
    try {

        await checkAdmin(req.user.id_utilisateur);

        const agences = await prisma.alerte.findMany({
            include: {
                agence: {
                    select: {
                        nom: true
                    }
                }
            },
        });

        return success(
            res,
            200,
            "Liste des agences",
            agences
        );

    } catch (err) { return error(res, 500, err.message) }
};