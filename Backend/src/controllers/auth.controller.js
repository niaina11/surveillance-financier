const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { success, error } = require('../utils/response');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { notifierAdmins } = require('../utils/notify');

// ─── PUBLIC : Liste des agences ───────────────────────────────────────────────
exports.listerAgencesPublic = async (req, res) => {
    try {
        const agences = await prisma.agence.findMany({
            select: { id_agence: true, nom: true }
        });
        return success(res, 200, "Liste publique des agences", agences);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── REGISTER : Création compte en attente ────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, mot_de_passe, role, id_agence } = req.body;

        const existeDeja = await prisma.utilisateur.findUnique({ where: { email } });
        if (existeDeja) return error(res, 400, "Cet email est déjà utilisé");

        if (role === "AGENT" && !id_agence)
            return error(res, 400, "L'agence est obligatoire pour un agent");

        if (role === "ADMIN" && id_agence)
            return error(res, 400, "Un administrateur ne doit pas être rattaché à une agence");

        const motDePasseHache = await bcrypt.hash(mot_de_passe, 10);

        const user = await prisma.utilisateur.create({
            data: {
                nom,
                prenom,
                email,
                telephone,
                mot_de_passe: motDePasseHache,
                role,
                statut: "EN_ATTENTE",
                id_agence: role === "AGENT" ? id_agence : null
            }
        });

        const io = req.app.get('io');
        await notifierAdmins(io, {
            titre: 'Création de compte',
            message: `${user.prenom} ${user.nom} a fait une création de compte`,
            type: 'CREATION',
        });

        return success(res, 201, "Demande d'inscription envoyée. En attente de validation par l'administrateur.", {
            id_utilisateur: user.id_utilisateur
        });

    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── LOGIN : Bloquer si pas APPROUVE ─────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        const user = await prisma.utilisateur.findUnique({
            where: { email },
            include: { agence: true }
        });

        if (!user) return error(res, 401, "Email ou mot de passe incorrect");

        const motDePasseValide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
        if (!motDePasseValide) return error(res, 401, "Email ou mot de passe incorrect");

        // ✅ Vérification du statut
        if (user.statut === "EN_ATTENTE") {
            return error(res, 403, "Votre compte est en attente de validation par l'administrateur.");
        }

        if (user.statut === "REJETE") {
            return error(res, 403, "Votre demande d'inscription a été rejetée. Contactez l'administrateur.");
        }

        const token = jwt.sign(
            {
                id_utilisateur: user.id_utilisateur,
                role: user.role,
                id_agence: user.id_agence,
                nom: user.nom,
                prenom: user.prenom,
                telephone: user.telephone,
                nom_agence: user.agence?.nom || null
            },
            process.env.JWT_SECRET || 'votre_cle_secrete_icisdsdhzuagfjfbs_sdbs',
            { expiresIn: '24h' }
        );

        return success(res, 200, "Connexion réussie", {
            token,
            id_utilisateur: user.id_utilisateur,
            role: user.role,
            id_agence: user.id_agence,
            nom: user.nom,
            prenom: user.prenom,
            nom_agence: user.agence?.nom || "Aucune agence attribuée"
        });

    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── ADMIN : Lister comptes en attente ───────────────────────────────────────
exports.listerComptesEnAttente = async (req, res) => {
    try {
        const comptes = await prisma.utilisateur.findMany({
            where: { statut: "EN_ATTENTE" },
            select: {
                id_utilisateur: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                role: true,
                statut: true,
                agence: { select: { nom: true } }
            },
            orderBy: { id_utilisateur: 'desc' }
        });
        return success(res, 200, "Comptes en attente", comptes);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── ADMIN : Lister tous les comptes ─────────────────────────────────────────
exports.listerTousLesComptes = async (req, res) => {
    try {
        const comptes = await prisma.utilisateur.findMany({
            select: {
                id_utilisateur: true,
                nom: true,
                prenom: true,
                email: true,
                telephone: true,
                role: true,
                statut: true,
                agence: { select: { nom: true } }
            },
            orderBy: { id_utilisateur: 'desc' }
        });
        return success(res, 200, "Tous les comptes", comptes);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── ADMIN : Valider un compte ────────────────────────────────────────────────
exports.validerCompte = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.utilisateur.findUnique({
            where: { id_utilisateur: id }
        });

        if (!user) return error(res, 404, "Utilisateur introuvable");
        if (user.statut !== "EN_ATTENTE")
            return error(res, 400, "Ce compte n'est pas en attente de validation");

        await prisma.utilisateur.update({
            where: { id_utilisateur: id },
            data: { statut: "APPROUVE" }
        });

        return success(res, 200, "Compte approuvé avec succès", null);
    } catch (err) {
        return error(res, 500, err.message);
    }
};

// ─── ADMIN : Rejeter un compte ────────────────────────────────────────────────
exports.rejeterCompte = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.utilisateur.findUnique({
            where: { id_utilisateur: id }
        });

        if (!user) return error(res, 404, "Utilisateur introuvable");
        if (user.statut !== "EN_ATTENTE")
            return error(res, 400, "Ce compte n'est pas en attente de validation");

        await prisma.utilisateur.update({
            where: { id_utilisateur: id },
            data: { statut: "REJETE" }
        });

        return success(res, 200, "Compte rejeté", null);
    } catch (err) {
        return error(res, 500, err.message);
    }
};