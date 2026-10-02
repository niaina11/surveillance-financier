const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Enregistrer une action dans le journal d'audit
 */
exports.enregistrer = async ({
    action,
    module,
    description,
    id_utilisateur,
    id_agence
}) => {
    try {
        return await prisma.journalAudit.create({
            data: {
                action,
                module,
                description,
                id_utilisateur,
                id_agence
            }
        });
    } catch (err) {
        console.error("Erreur JournalAudit :", err.message);
    }
};

/**
 * Lister tous les journaux d'audit
 */
exports.lister = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // 2. Calculer le décalage (offset)
        const skip = (page - 1) * limit;

        // 3. Exécuter la requête de données ET le comptage total en parallèle pour de meilleures performances
        const [journaux, totalItems] = await prisma.$transaction([
            prisma.journalAudit.findMany({
                skip: skip,
                take: limit,
                include: {
                    utilisateur: {
                        select: {
                            nom: true,
                            prenom: true
                        }
                    },
                    agence: {
                        select: {
                            nom: true
                        }
                    }
                },
                orderBy: {
                    date_action: "asc"
                }
            }),
            prisma.journalAudit.count() // Compte le nombre total de lignes dans la table
        ]);

        // 4. Calculer le nombre total de pages
        const totalPages = Math.ceil(totalItems / limit);

        // 5. Renvoyer la réponse enrichie des métadonnées de pagination
        return res.status(200).json({
            success: true,
            data: journaux,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
