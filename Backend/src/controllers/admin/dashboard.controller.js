const { PrismaClient } = require("@prisma/client");
const { error, success } = require("../../utils/response");
const e = require("express");
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

exports.getNombreAgences = async (req, res) => {
    try {
        await checkAdmin(req.user.id_utilisateur);
        const nombreAgences = await prisma.agence.count();
        return success(res, 200, "Nombre d'agences", { nombreAgences });
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.getNombreAgents = async (req, res) => {
    try {
        await checkAdmin(req.user.id_utilisateur);
        const nombreAgents = await prisma.utilisateur.count({
            where: { role: "AGENT" }
        });
        return success(res, 200, "Nombre d'agents", { nombreAgents });
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.getRecette = async (req, res) => {
    try {
        await checkAdmin(req.user.id_utilisateur);

        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

        const recettes = await prisma.operation.aggregate({
            _sum: { montant: true },
            where: {
                type_operation: 'ENCAISSEMENT',
                date_operation: {
                    gte: debutMois,
                    lte: finMois
                }
            }
        });

        return success(res, 200, "Recette du mois", { recette: recettes._sum.montant || 0 });
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.getDepense = async (req, res) => {
    try {
        await checkAdmin(req.user.id_utilisateur);

        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

        const depenses = await prisma.operation.aggregate({
            _sum: { montant: true },
            where: {
                type_operation: { in: ["DECAISSEMENT", "TRANSFERT"] },
                date_operation: {
                    gte: debutMois,
                    lte: finMois
                }
            }
        });

        return success(res, 200, "Dépense du mois", { depense: depenses._sum.montant || 0 });
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.evolutionMensuelle = async (req, res) => {
    try {
        const anneeActuelle = new Date().getFullYear();
        const debutAnnee = new Date(`${anneeActuelle}-01-01`);
        const finAnnee = new Date(`${anneeActuelle}-12-31T23:59:59`);

        const operations = await prisma.operation.findMany({
            where: {
                date_operation: {
                    gte: debutAnnee,
                    lte: finAnnee
                }
            },
            select: {
                type_operation: true,
                montant: true,
                date_operation: true
            }
        });

        const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        // Initialise les 12 mois à 0
        const stats = moisLabels.map(mois => ({ mois, recettes: 0, depenses: 0 }));

        operations.forEach(op => {
            const moisIndex = new Date(op.date_operation).getMonth(); // 0-11
            if (op.type_operation === 'ENCAISSEMENT') {
                stats[moisIndex].recettes += op.montant;
            } else if (op.type_operation === 'DECAISSEMENT' || op.type_operation === 'TRANSFERT') {
                stats[moisIndex].depenses += op.montant;
            }
        });

        return success(res, 200, "Évolution mensuelle", stats);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.soldeParAgence = async (req, res) => {
    try {
        await checkAdmin(req.user.id_utilisateur);
        const soldeParAgence = await prisma.solde.findMany({
            select: {
                montant_actuel: true,
                agence: {
                    select: {
                        id_agence: true,
                        nom:true,
                    }
                }
            }
        });
        return success(res, 200, "Solde par agence", soldeParAgence);
    } catch (err) {
        return error(res, 500, err.message);
    }
};
