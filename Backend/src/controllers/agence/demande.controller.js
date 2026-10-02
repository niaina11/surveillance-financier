const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../../utils/response');
const { notifierAdmins } = require('../../utils/notify');


exports.soumettreDemandeModification = async (req, res) => {
    try {
        const { id_operation, nouveau_montant, motif } = req.body;
        const id_agent = String(req.user.id_utilisateur);
        const id_agence = String(req.user.id_agence);

        if (!id_operation || !nouveau_montant || !motif) {
            return error(res, 400, "id_operation, nouveau_montant et motif sont requis");
        }

        // Vérifier que l'opération existe et appartient à l'agent
        const operation = await prisma.operation.findUnique({
            where: { id_operation: String(id_operation) }
        });

        if (!operation) return error(res, 404, "Opération introuvable");
        if (operation.id_agent !== id_agent) {
            return error(res, 403, "Vous ne pouvez modifier que vos propres opérations");
        }

        // Créer la demande en utilisant le modèle existant
        const demande = await prisma.demande.create({
            data: {
                description: `${motif}`, // ← encode l'id_operation dans la description
                montant_demande: parseFloat(nouveau_montant),
                statut: 'EN_ATTENTE',
                id_agent,
                id_agence,
            }
        });

        // Notifier les admins
        const io = req.app.get('io');
        await notifierAdmins(io, {
            titre: 'Demande de modification',
            message: `Un agent demande la modification de l'opération ${id_operation}`,
            type: 'MODIFICATION',
        });

        return success(res, 201, "Demande de modification envoyée", demande);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.faireDemande = async (req, res) => {
    try {
        const { id_agent, id_agence, montant_demande, description } = req.body;
        const agent_id = req.user.id_utilisateur;
        const agence_id = req.user.id_agence;
        const agent = await prisma.utilisateur.findUnique({
            where: { id_utilisateur: agent_id },
            include: { agence: true }
        });
        if (!agent || agent.role !== 'AGENT') return error(res, 403, "Accès réservé aux agents");
        if (!agent.id_agence) return error(res, 400, "L'agent n'est rattaché à aucune agence");

        const demande = await prisma.demande.create({
            data: { montant_demande: parseFloat(montant_demande), description, id_agent: agent_id, id_agence: agence_id }
        });

        const io = req.app.get('io');
        await notifierAdmins(io, {
            titre: 'Nouvelle demande',
            message: `${agent.prenom} ${agent.nom} (${agent.agence?.nom || 'agence inconnue'}) a soumis une demande de ${parseFloat(montant_demande).toLocaleString('fr-FR')} Ar`,
            type: 'ALERTE'
        });
        return success(res, 201, "Demande envoyée", demande);
    } catch (err) { return error(res, 500, err.message) }
}

exports.allDemandes = async (req, res) => {
    try {
        const demandes = await prisma.demande.findMany({
            orderBy: { date_demande: 'desc' },
            include: { agent: { select: { nom: true, prenom: true } }, agence: { select: { nom: true } } }
        });
        return success(res, 200, "Mes demandes", demandes);
    } catch (err) { return error(res, 500, err.message) }
}

exports.mesDemandes = async (req, res) => {
    try {
        const agent_id = req.user.id_utilisateur;

        if (!agent_id) {
            return error(res, 400, "id_utilisateur est requis");
        }

        const demandes = await prisma.demande.findMany({
            where: { id_agent: agent_id },
            include: {
                agent: { select: { nom: true, prenom: true } },
                agence: { select: { nom: true } }
            },
            orderBy: { date_demande: 'desc' } // adapte le nom du champ si différent
        });

        return success(res, 200, "Mes demandes", demandes);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.validerDemande = async (req, res) => {
    try {
        const { id_demande } = req.params;

        const demande = await prisma.demande.findUnique({
            where: { id_demande }
        });

        if (!demande) {
            return error(res, 404, "Demande introuvable");
        }

        if (demande.statut !== 'EN_ATTENTE') {
            return error(res, 400, "Cette demande a déjà été traitée");
        }

        const demandeMaj = await prisma.demande.update({
            where: { id_demande },
            data: { statut: 'VALIDEE' }
        });

        return success(res, 200, "Demande validée avec succès", demandeMaj);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

exports.refuserDemande = async (req, res) => {
    try {
        const { id_demande } = req.params;

        const demande = await prisma.demande.findUnique({
            where: { id_demande }
        });

        if (!demande) {
            return error(res, 404, "Demande introuvable");
        }

        if (demande.statut !== 'EN_ATTENTE') {
            return error(res, 400, "Cette demande a déjà été traitée");
        }

        const demandeMaj = await prisma.demande.update({
            where: { id_demande },
            data: { statut: 'REFUSEE' }
        });

        return success(res, 200, "Demande refusée", demandeMaj);
    } catch (err) {
        return error(res, 500, err.message);
    }
};