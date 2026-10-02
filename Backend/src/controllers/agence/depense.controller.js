const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../../utils/response');

const creerDepense = async (req, res) => {
    try {
        const { id_utilisateur, montant, motif } = req.body;
        const agent = await prisma.utilisateur.findUnique({ where: { id_utilisateur } });
        if (!agent || agent.role !== 'AGENT') return error(res, 403, "Accès Agent requis");

        const depense = await prisma.depense.create({
            data: { 
                montant: parseFloat(montant), 
                motif, 
                id_utilisateur, 
                id_agence: agent.id_agence 
            }
        });

        const solde = await prisma.solde.findUnique({ where: { id_agence: agent.id_agence } });
        await prisma.solde.update({
            where: { id_agence: agent.id_agence },
            data: { montant_actuel: parseFloat(solde.montant_actuel) - parseFloat(montant) }
        });

        return success(res, 201, "Dépense enregistrée", depense);
    } catch (err) { return error(res, 500, err.message) }
}

const listerDepenses = async (req, res) => {
    try {
        const { id_utilisateur } = req.query;
        const agent = await prisma.utilisateur.findUnique({ where: { id_utilisateur } });
        if (!agent || agent.role !== 'AGENT') return error(res, 403, "Accès Agent requis");
        
        const depenses = await prisma.depense.findMany({ 
            where: { id_agence: agent.id_agence },
            orderBy: { date_depense: 'desc' }
        });
        return success(res, 200, "Liste des dépenses", depenses);
    } catch (err) { return error(res, 500, err.message) }
}

module.exports = { 
    creerDepense, 
    listerDepenses 
}