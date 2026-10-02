const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../../utils/response');

exports.getSolde = async (req, res) => {
    try {
        const { id_utilisateur } = req.query;
        
        const agent = await prisma.utilisateur.findUnique({ where: { id_utilisateur } });
        if (!agent || agent.role !== 'AGENT') return error(res, 403, "Accès Agent requis");

        const solde = await prisma.solde.findUnique({ where: { id_agence: agent.id_agence } });
        
        if(!solde) return error(res, 404, "Solde de l'agence introuvable");

        return success(res, 200, "Solde de la caisse", {
            id_agence: agent.id_agence,
            montant_actuel: solde.montant_actuel
        });
    } catch (err) { return error(res, 500, err.message) }
}