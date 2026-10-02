const { PrismaClient } = require("@prisma/client");
const { error, success } = require("../../utils/response");
const e = require("express");
const prisma = new PrismaClient();

exports.getRecette = async (req, res) => {
    try {

        const id_agence = req.user.id_agence;
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

        const recettes = await prisma.operation.aggregate({
            _sum: { montant: true },
            where: {
                id_agence: id_agence,
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
        const id_agence = req.user.id_agence;
        const maintenant = new Date();
        const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
        const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0, 23, 59, 59);

        const depenses = await prisma.operation.aggregate({
            _sum: { montant: true },
            where: {
                id_agence: id_agence,
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

exports.soldeActu = async (req, res) => {
    try {
        const id_agence = req.user.id_agence;

        const solde = await prisma.solde.findUnique({
            where: {
                id_agence: id_agence
            },
            select: {
                montant_actuel: true
            }
        });

        return success(res, 200, "Solde récupéré avec succès", {
            solde: solde?.montant_actuel || 0
        });

    } catch (err) {
        console.error("Erreur solde :", err);
        return error(res, 500, err.message);
    }
};