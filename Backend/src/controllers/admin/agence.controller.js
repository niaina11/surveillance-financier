const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { success, error } = require("../../utils/response");
const journalAudit = require("../audit.controller");

// Vérifie que l'utilisateur est ADMIN
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

// =======================
// Créer une agence
// =======================
exports.creerAgence = async (req, res) => {
    try {

        const {
            nom,
            adresse,
            telephone,
            fonds_minimum,
            fonds_maximum,
            montant_actuel,
            seuil_alerte
        } = req.body;

        // Vérifie que le token appartient à un ADMIN
        await checkAdmin(req.user.id_utilisateur);

        // Création de l'agence
        const agence = await prisma.agence.create({
            data: {
                nom,
                adresse,
                telephone,

                solde: {
                    create: {
                        montant_actuel: parseFloat(montant_actuel)
                    }
                },

                parametre: {
                    create: {
                        fonds_minimum: parseFloat(fonds_minimum),
                        fonds_maximum: parseFloat(fonds_maximum),
                        seuil_alerte: parseFloat(seuil_alerte)
                    }
                }
            },
            include: {
                solde: true,
                parametre: true
            }
        });

        // Journal d'audit
        await journalAudit.enregistrer({
            action: "CREATE",
            module: "AGENCE",
            description: `Création de l'agence ${agence.nom}`,
            id_utilisateur: req.user.id_utilisateur,
            id_agence: agence.id_agence
        });

        return success(
            res,
            201,
            "Agence créée avec succès",
            agence
        );

    } catch (err) {
        return error(res, 500, err.message);
    }
};


exports.listerAgences = async (req, res) => {
    try {

        await checkAdmin(req.user.id_utilisateur);

        const agences = await prisma.agence.findMany({
            include: {
                solde: true,
                parametre: true
            }
        });

        return success(
            res,
            200,
            "Liste des agences",
            agences
        );

    } catch (err) {
        return error(res, 500, err.message);
    }
};


exports.modifierAgence = async (req, res) => {
    try {

        await checkAdmin(req.user.id_utilisateur);

        const { id_agence } = req.params;

        const {
            nom,
            adresse,
            telephone,
            fonds_minimum,
            fonds_maximum,
            seuil_alerte
        } = req.body;

        const agence = await prisma.agence.update({
            where: {
                id_agence: id_agence
            },
            data: {
                nom,
                adresse,
                telephone,

                parametre: {
                    update: {
                        fonds_minimum: parseFloat(fonds_minimum),
                        fonds_maximum: parseFloat(fonds_maximum),
                        seuil_alerte: parseFloat(seuil_alerte)
                    }
                }
            },
            include: {
                parametre: true,
                solde: true
            }
        });

        await journalAudit.enregistrer({
            action: "UPDATE",
            module: "AGENCE",
            description: `Modification de l'agence ${agence.nom}`,
            id_utilisateur: req.user.id_utilisateur,
            id_agence: agence.id_agence
        });

        return success(
            res,
            200,
            "Agence modifiée avec succès",
            agence
        );

    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.getAgence = async (req, res) => {
    try {

        await checkAdmin(req.user.id_utilisateur);

        const { id } = req.params;

        const agence = await prisma.agence.findUnique({
            where: {
                id_agence: id
            },
            include: {
                solde: true,
                parametre: true
            }
        });

        if (!agence) {
            return error(res, 404, "Agence introuvable");
        }

        return success(
            res,
            200,
            "Agence trouvée",
            agence
        );

    } catch (err) {
        return error(res, 500, err.message);
    }
};