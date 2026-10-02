const { PrismaClient } = require("@prisma/client");
const { error, success } = require("../../utils/response");
const prisma = new PrismaClient();

const checkAdmin = async (id_utilisateur) => {
    const user = await prisma.utilisateur.findUnique({
        where: { id_utilisateur }
    });
    if (!user || user.role !== "ADMIN") {
        throw new Error("Accès Admin requis");
    }
    return user;
};

exports.genererRapport = async (req, res) => {
    try {
        await checkAdmin(req.user.id_utilisateur);

        const { periode, date, id_agence } = req.query;

        if (!periode || !date) {
            return error(res, 400, "periode et date sont requis");
        }
        if (!['jour', 'semaine', 'mois'].includes(periode)) {
            return error(res, 400, "periode doit être 'jour', 'semaine' ou 'mois'");
        }

        const dateRef = new Date(date);
        let debut, fin;

        if (periode === 'jour') {
            debut = new Date(dateRef);
            debut.setHours(0, 0, 0, 0);
            fin = new Date(dateRef);
            fin.setHours(23, 59, 59, 999);

        } else if (periode === 'semaine') {
            const jour = dateRef.getDay();
            const diffLundi = jour === 0 ? -6 : 1 - jour;
            debut = new Date(dateRef);
            debut.setDate(dateRef.getDate() + diffLundi);
            debut.setHours(0, 0, 0, 0);
            fin = new Date(debut);
            fin.setDate(debut.getDate() + 6);
            fin.setHours(23, 59, 59, 999);

        } else {
            debut = new Date(dateRef.getFullYear(), dateRef.getMonth(), 1);
            fin = new Date(dateRef.getFullYear(), dateRef.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        // ─── Filtre agence ────────────────────────────────────────────────────
        const filtreAgence = id_agence ? { id_agence: id_agence } : {};

        const whereOp = {
            date_operation: { gte: debut, lte: fin },
            ...filtreAgence
        };

        // ─── Résumé financier ─────────────────────────────────────────────────
        const [recettesAgg, depensesAgg, nbOperations] = await Promise.all([
            prisma.operation.aggregate({
                _sum: { montant: true },
                where: { ...whereOp, type_operation: 'ENCAISSEMENT' }
            }),
            prisma.operation.aggregate({
                _sum: { montant: true },
                where: { ...whereOp, type_operation: { in: ['DECAISSEMENT', 'TRANSFERT'] } }
            }),
            prisma.operation.count({ where: whereOp })
        ]);

        const totalRecettes = Number(recettesAgg._sum.montant || 0);
        const totalDepenses = Number(depensesAgg._sum.montant || 0);

        // ─── Évolution par tranche ────────────────────────────────────────────
        const toutesOps = await prisma.operation.findMany({
            where: whereOp,
            select: { type_operation: true, montant: true, date_operation: true }
        });

        const evolutionMap = {};

        toutesOps.forEach(op => {
            const d = new Date(op.date_operation);
            let key;

            if (periode === 'jour') {
                // Par heure
                key = `${String(d.getHours()).padStart(2, '0')}h`;
            } else if (periode === 'semaine') {
                // Par jour de la semaine
                const jours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                key = jours[d.getDay()];
            } else {
                // Par jour du mois
                key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!evolutionMap[key]) {
                evolutionMap[key] = {
                    periode: key,
                    encaissements: 0,
                    decaissements: 0,
                    solde_net: 0
                };
            }

            const montant = Number(op.montant);
            if (op.type_operation === 'ENCAISSEMENT') {
                evolutionMap[key].encaissements += montant;
            } else {
                evolutionMap[key].decaissements += montant;
            }
            evolutionMap[key].solde_net =
                evolutionMap[key].encaissements - evolutionMap[key].decaissements;
        });

        // Trier l'évolution chronologiquement
        const evolution = Object.values(evolutionMap).sort((a, b) =>
            a.periode.localeCompare(b.periode)
        );

        // ─── Demandes par statut ──────────────────────────────────────────────
        const demandesParStatut = await prisma.demande.groupBy({
            by: ['statut'],
            _count: { statut: true },
            where: { date_demande: { gte: debut, lte: fin } }
        });

        // ─── Alertes ──────────────────────────────────────────────────────────
        const whereAlerte = {
            date_creation: { gte: debut, lte: fin },
            ...filtreAgence
        };

        const [alertesParStatut, alertesParType] = await Promise.all([
            prisma.alerte.groupBy({
                by: ['statut'],
                _count: { statut: true },
                where: whereAlerte
            }),
            prisma.alerte.groupBy({
                by: ['type_alerte'],
                _count: { type_alerte: true },
                where: whereAlerte
            })
        ]);

        // ─── Détail par agence (seulement si pas de filtre agence) ───────────
        let detailParAgence = [];

        if (!id_agence) {
            const agences = await prisma.agence.findMany({
                select: { id_agence: true, nom: true }
            });

            detailParAgence = await Promise.all(
                agences.map(async (ag) => {
                    const whereAgence = {
                        date_operation: { gte: debut, lte: fin },
                        id_agence: ag.id_agence
                    };

                    const [rec, dep, nbOps, nbAlertes] = await Promise.all([
                        prisma.operation.aggregate({
                            _sum: { montant: true },
                            where: { ...whereAgence, type_operation: 'ENCAISSEMENT' }
                        }),
                        prisma.operation.aggregate({
                            _sum: { montant: true },
                            where: { ...whereAgence, type_operation: { in: ['DECAISSEMENT', 'TRANSFERT'] } }
                        }),
                        prisma.operation.count({ where: whereAgence }),
                        prisma.alerte.count({
                            where: { id_agence: ag.id_agence, date_creation: { gte: debut, lte: fin } }
                        })
                    ]);

                    const r = Number(rec._sum.montant || 0);
                    const d = Number(dep._sum.montant || 0);

                    return {
                        agence: ag.nom,
                        recettes: r,
                        depenses: d,
                        solde: r - d,
                        nombre_operations: nbOps,
                        nombre_alertes: nbAlertes
                    };
                })
            );

            // Garder seulement les agences ayant des opérations
            detailParAgence = detailParAgence.filter(a => a.nombre_operations > 0);
        }

        // ─── Réponse ──────────────────────────────────────────────────────────
        return success(res, 200, "Rapport généré", {
            periode,
            date_debut: debut,
            date_fin: fin,
            agence_filtre: id_agence ? parseInt(id_agence) : null,
            resume: {
                total_recettes: totalRecettes,
                total_depenses: totalDepenses,
                solde_net: totalRecettes - totalDepenses,
                nombre_operations: nbOperations
            },
            evolution,
            demandes: demandesParStatut.map(d => ({
                statut: d.statut,
                nombre: d._count.statut
            })),
            alertes_par_statut: alertesParStatut.map(a => ({
                statut: a.statut,
                nombre: a._count.statut
            })),
            alertes_par_type: alertesParType.map(a => ({
                type: a.type_alerte,
                nombre: a._count.type_alerte
            })),
            detail_agences: detailParAgence
        });

    } catch (err) {
        return error(res, 500, err.message);
    }
};