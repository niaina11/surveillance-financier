const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../../utils/response');
const prisma = new PrismaClient();

// ─── Lister toutes les demandes ───────────────────────────────────────────────
exports.listerDemandes = async (req, res) => {
    try {
        const demandes = await prisma.demande.findMany({
            include: {
                agent: { select: { nom: true, prenom: true, role: true } },
                agence: { select: { nom: true } }
            },
            orderBy: { date_demande: 'desc' }
        });

        // Parser le type de demande
        const parsed = demandes.map(d => {
            if (d.description?.startsWith('MODIF_OP:')) {
                const parts = d.description.replace('MODIF_OP:', '').split('|');
                return {
                    ...d,
                    type: 'MODIFICATION',
                    id_operation: parts[0],
                    motif: parts[1] || '',
                };
            }
            return { ...d, type: 'AUTRE' };
        });

        return success(res, 200, "Demandes", parsed);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── Traiter une demande (valider ou refuser) ─────────────────────────────────
exports.traiterDemande = async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body; // VALIDEE ou REFUSEE

        if (!['VALIDEE', 'REFUSEE'].includes(statut)) {
            return error(res, 400, "statut doit être VALIDEE ou REFUSEE");
        }

        const demande = await prisma.demande.findUnique({
            where: { id_demande: String(id) }
        });

        if (!demande) return error(res, 404, "Demande introuvable");
        if (demande.statut !== 'EN_ATTENTE') {
            return error(res, 400, "Cette demande a déjà été traitée");
        }

        // Si validée et c'est une demande de modification → appliquer
        if (statut === 'VALIDEE' && demande.description?.startsWith('MODIF_OP:')) {
            const parts = demande.description.replace('MODIF_OP:', '').split('|');
            const id_operation = parts[0];

            await prisma.operation.update({
                where: { id_operation },
                data: { montant: demande.montant_demande }
            });
        }

        // Mettre à jour le statut de la demande
        const updated = await prisma.demande.update({
            where: { id_demande: String(id) },
            data: { statut }
        });

        return success(res, 200, `Demande ${statut.toLowerCase()}`, updated);
    } catch (err) {
        return error(res, 500, err.message);
    }
};