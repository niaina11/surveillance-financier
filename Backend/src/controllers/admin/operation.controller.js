const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../../utils/response');

exports.listerOperationsAgence = async (req, res) => { 
    try {
        const { 
            id_utilisateur_admin, 
            id_agence, 
            nom_agence,
            lieu,
            id_agent,
            type_operation,
            date_debut, 
            date_fin 
        } = req.query;

        const admin = await prisma.utilisateur.findUnique({ 
            where: { id_utilisateur: id_utilisateur_admin } 
        });
        if (!admin || admin.role !== 'ADMIN') return error(res, 403, "Accès Admin requis");

        const where = {};

        if (id_agence) {
            where.id_agence = id_agence;
        }
        if (nom_agence || lieu) {
            where.agence = {};
            if (nom_agence) {
                where.agence.nom = { contains: nom_agence, mode: 'insensitive' }
            }
            if (lieu) {
                where.agence.ville = { contains: lieu, mode: 'insensitive' }
            }
        }

        if (id_agent) {
            where.id_utilisateur = id_agent;
        }

        if (type_operation) {
            where.type_operation = type_operation;
        }

        if(date_debut && date_fin) {
            where.createdat = { 
                gte: new Date(date_debut), 
                lte: new Date(date_fin + 'T23:59:59')
            }
        }

        const operations = await prisma.operation.findMany({ 
            where, 
            include: { 
                utilisateur: { select: { id_utilisateur: true, nom: true, prenom: true, email: true } },
                agence: { select: { id_agence: true, nom: true, ville: true } }  // <-- FERMÉ ICI
            },
            orderBy: { createdat: 'desc' }
        });

        return success(res, 200, `Historique: ${operations.length} opération(s) trouvée(s)`, operations);
    } catch (err) { return error(res, 500, err.message) }
}