const { prisma } = require('../../config/db');
const { success, error } = require('../../utils/response');
const journalAudit = require("../audit.controller");
const alert = require("../admin/alert.controller");
const { notifierAdmins } = require('../../utils/notify');

exports.effectuerOperation = async (req, res) => {
    try {
        const {
            nom_client,
            prenom_client,
            numero_client,
            type_operation,
            montant,
            description
        } = req.body;

        const id_agent = req.user.id_utilisateur;
        const id_agence = req.user.id_agence;
        const agent = await prisma.utilisateur.findUnique({
            where: { id_utilisateur: id_agent },
            include: { agence: true }
        });

        if (!agent || agent.role !== 'AGENT') return error(res, 403, "Accès réservé aux agents");
        if (!agent.id_agence) return error(res, 400, "L'agent n'est rattaché à aucune agence");

        const montantNum = parseFloat(montant);
        if (isNaN(montantNum) || montantNum <= 0) return error(res, 400, "Montant invalide");

        if (type_operation === 'DECAISSEMENT' || type_operation === 'TRANSFERT') {
            const solde = await prisma.solde.findUnique({ where: { id_agence: agent.id_agence } });
            if (!solde || solde.montant_actuel < montantNum) {
                return error(res, 400, "Solde insuffisant dans l'agence");
            }
        }

        const operation = await prisma.$transaction(async (tx) => {
            const newOp = await tx.operation.create({
                data: {
                    type_operation,
                    montant: montantNum,
                    description,
                    nom_client,
                    prenom_client,
                    numero_client,
                    date_operation: new Date(),
                    id_agent: id_agent,
                    id_agence: id_agence
                }
            });
            const io = req.app.get('io');
            await notifierAdmins(io, {
                titre: 'Nouvelle opération',
                message: `${agent.prenom} ${agent.nom} (${agent.agence?.nom || 'agence inconnue'}) a soumis une opération de ${parseFloat(montantNum).toLocaleString('fr-FR')} Ar`,
                type: 'OPERATION',
            });

            // Journal d'audit
            await journalAudit.enregistrer({
                action: "CREATE",
                module: "Opération",
                description: `Création de l'opération de type ${newOp.type_operation} pour le client ${nom_client} ${prenom_client}`,
                id_utilisateur: id_agent,
                id_agence: id_agence
            });

            // 2. Mettre à jour le solde de l'agence
            if (type_operation === 'ENCAISSEMENT') {
                await tx.solde.upsert({
                    where: { id_agence: id_agence },
                    update: { montant_actuel: { increment: montantNum } },
                    create: { id_agence: id_agence, montant_actuel: montantNum }
                });
            } else {
                await tx.solde.update({
                    where: { id_agence: id_agence },
                    data: { montant_actuel: { decrement: montantNum } }
                });

                const soldeActuel = await tx.solde.findUnique({ where: { id_agence: id_agence } });
                const parametre = await tx.parametreAgence.findUnique({ where: { id_agence: id_agence } });
                if (soldeActuel.montant_actuel < parametre.seuil_alerte) {
                    await alert.saveAlert({
                        type_alerte: "SEUIL_ATTEINT",
                        message: `Le solde de l'agence ${agent.agence.nom} est inférieur au seuil d'alerte.`,
                        statut: "MOYENNE",
                        id_agence: id_agence
                    });
                    const io = req.app.get('io');
                    await notifierAdmins(io, {
                        titre: 'Nouvelle alerte',
                        message: `${agent.prenom} ${agent.nom} (${agent.agence?.nom || 'agence inconnue'}) a soumis une opération de ${parseFloat(montantNum).toLocaleString('fr-FR')} Ar`,
                        type: 'ALERTE'
                    });
                }
                if (soldeActuel.montant_actuel < montantNum) {
                    await alert.saveAlert({
                        type_alerte: "SOLDE_INSUFFISANT",
                        statut: "CRITIQUE",
                        message: `Le solde de l'agence ${agent.agence.nom} est inférieur au montant de l'opération.`,
                        id_agence: id_agence
                    });
                    const io = req.app.get('io');
                    await notifierAdmins(io, {
                        titre: 'Nouvelle alerte critique',
                        message: `${agent.prenom} ${agent.nom} (${agent.agence?.nom || 'agence inconnue'}) a soumis une opération de ${parseFloat(montantNum).toLocaleString('fr-FR')} Ar`,
                        type: 'ALERTE'
                    });
                }
            }
            return newOp;
        });

        return success(res, 201, "Opération effectuée avec succès", operation);

    } catch (err) {
        return error(res, 500, err.message)
    }
};

exports.mesOperations = async (req, res) => {
    try {
        const { id_utilisateur } = req.user;
        if (!id_utilisateur) return error(res, 400, "id_utilisateur manquant");

        const operations = await prisma.operation.findMany({
            where: { id_agent: id_utilisateur },
            include: {
                agence: { select: { nom: true, adresse: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return success(res, 200, `${operations.length} opération(s) trouvée(s)`, operations);
    } catch (err) {
        return error(res, 500, err.message)
    }
};

exports.listerOperationsAgence = async (req, res) => {
    try {
        const { id_agence } = req.user.id_agence;
        const operations = await prisma.operation.findMany({
            where: { id_agence },
            include: {
                agent: { select: { nom: true, prenom: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return success(res, 200, `${operations.length} opération(s) trouvée(s)`, operations);
    } catch (err) {
        return error(res, 500, err.message)
    }
};

exports.getAllOperation = async (req, res) => {
    try {
        const operations = await prisma.operation.findMany({
            include: {
                agent: {
                    select: {
                        nom: true,
                        prenom: true
                    }
                },
                agence: {
                    select: {
                        nom: true,
                        adresse: true
                    }
                }
            },
            orderBy: {
                date_operation: 'desc'
            }
        });
        console.log("Opérations récupérées:", operations);
        if (!operations) return error(res, 404, "Opération non trouvée");
        return success(res, 200, "Opération trouvée", operations);
    } catch (err) {
        return error(res, 500, err.message)
    }
};

exports.annulerOperation = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx) => {
            const op = await tx.operation.findUnique({ where: { id_operation: id } });
            if (!op) return error(res, 404, "Opération non trouvée");
            if (op.description?.includes("[ANNULEE]")) return error(res, 400, "Opération déjà annulée");

            // 1. Inverser l'effet sur le solde
            if (op.type_operation === 'ENCAISSEMENT') {
                await tx.solde.update({
                    where: { id_agence: op.id_agence },
                    data: { montant_actuel: { decrement: op.montant } }
                });
            } else { // DECAISSEMENT ou TRANSFERT
                await tx.solde.update({
                    where: { id_agence: op.id_agence },
                    data: { montant_actuel: { increment: op.montant } }
                });
            }

            // 2. Marquer l'opération comme annulée
            await tx.operation.update({
                where: { id_operation: id },
                data: { description: (op.description || "") + " [ANNULEE]" }
            });
        });

        return success(res, 200, "Opération annulée et solde mis à jour");
    } catch (err) {
        return error(res, 500, err.message)
    }
};

// D - SUPPRIMER
exports.supprimerOperation = async (req, res) => {
    return error(res, 403, "Suppression interdite. Veuillez utiliser l'annulation.");
}

exports.updateOperation = async (req, res) => {
    try {
        const {id_operation,  montant, description } = req.body;
        console.log("Update Operation Request Body:", req.body);
        if (!id_operation || !montant || !description) {
            return error(res, 400, "id_operation, montant et description sont requis");
        }
        await prisma.operation.update({
            where: { id_operation: id_operation },
            data: { montant, description }
        });
        return success(res, 200, "Opération mise à jour avec succès");
    } catch (err) {
        return error(res, 500, err.message)
    }
};