const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// ─── Config upload ────────────────────────────────────────────────────────────
if (!fs.existsSync('uploads/messages')) {
  fs.mkdirSync('uploads/messages', { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/messages/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

exports.upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ─── Liste utilisateurs ───────────────────────────────────────────────────────
exports.listeUtilisateurs = async (req, res) => {
  try {
    const id_utilisateur = String(req.user.id_utilisateur);
    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        id_utilisateur: { not: id_utilisateur },
        statut: 'APPROUVE'
      },
      select: {
        id_utilisateur: true,
        nom: true,
        prenom: true,
        role: true,
        agence: { select: { nom: true } }
      }
    });
    return success(res, 200, 'Utilisateurs', utilisateurs);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// ─── Ouvrir/créer conversation privée ────────────────────────────────────────
exports.ouvrirConversationPrivee = async (req, res) => {
  try {
    const { id_destinataire } = req.body;
    const id_expediteur = String(req.user.id_utilisateur);

    if (!id_destinataire) {
      return error(res, 400, "id_destinataire est requis");
    }

    const destId = String(id_destinataire);

    // Chercher conversation existante
    const existante = await prisma.conversation.findFirst({
      where: {
        type: 'PRIVE',
        AND: [
          { participants: { some: { id_utilisateur: id_expediteur } } },
          { participants: { some: { id_utilisateur: destId } } }
        ]
      },
      include: {
        participants: {
          include: {
            utilisateur: {
              select: { id_utilisateur: true, nom: true, prenom: true, role: true }
            }
          }
        },
        messages: {
          orderBy: { created_at: 'asc' },
          include: {
            expediteur: {
              select: { id_utilisateur: true, nom: true, prenom: true }
            }
          }
        }
      }
    });

    if (existante && existante.participants.length === 2) {
      return success(res, 200, 'Conversation existante', existante);
    }

    // ✅ Utiliser connect pour les String ids
    const nouvelle = await prisma.conversation.create({
      data: {
        type: 'PRIVE',
        participants: {
          create: [
            { utilisateur: { connect: { id_utilisateur: id_expediteur } } },
            { utilisateur: { connect: { id_utilisateur: destId } } }
          ]
        }
      },
      include: {
        participants: {
          include: {
            utilisateur: {
              select: { id_utilisateur: true, nom: true, prenom: true, role: true }
            }
          }
        },
        messages: true
      }
    });

    return success(res, 201, 'Conversation créée', nouvelle);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// ─── Créer un groupe ──────────────────────────────────────────────────────────
exports.creerGroupe = async (req, res) => {
  try {
    const { nom, participants } = req.body;
    const id_createur = String(req.user.id_utilisateur);

    // ✅ Tous en String
    const tous = [...new Set([id_createur, ...participants.map(String)])];

    const groupe = await prisma.conversation.create({
      data: {
        type: 'GROUPE',
        nom,
        participants: {
          create: tous.map(id => ({
            utilisateur: { connect: { id_utilisateur: id } }
          }))
        }
      },
      include: {
        participants: {
          include: {
            utilisateur: {
              select: { id_utilisateur: true, nom: true, prenom: true, role: true }
            }
          }
        },
        messages: true
      }
    });

    return success(res, 201, 'Groupe créé', groupe);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// ─── Mes conversations ────────────────────────────────────────────────────────
exports.mesConversations = async (req, res) => {
  try {
    const id_utilisateur = String(req.user.id_utilisateur);

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { id_utilisateur } }
      },
      include: {
        participants: {
          include: {
            utilisateur: {
              select: { id_utilisateur: true, nom: true, prenom: true, role: true }
            }
          }
        },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            expediteur: { select: { nom: true, prenom: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Compter messages non lus
    const convsAvecNonLus = await Promise.all(
      conversations.map(async (conv) => {
        const non_lus = await prisma.message.count({
          where: {
            id_conversation: conv.id_conversation,
            lu: false,
            id_expediteur: { not: id_utilisateur }
          }
        });
        return { ...conv, non_lus };
      })
    );

    return success(res, 200, 'Conversations', convsAvecNonLus);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// ─── Messages d'une conversation ──────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    // ✅ id_conversation est String (cuid)
    const id_conversation = String(req.params.id_conversation);
    const id_utilisateur = String(req.user.id_utilisateur);

    const messages = await prisma.message.findMany({
      where: { id_conversation },
      orderBy: { created_at: 'asc' },
      include: {
        expediteur: {
          select: { id_utilisateur: true, nom: true, prenom: true, role: true }
        }
      }
    });

    // Marquer comme lus
    await prisma.message.updateMany({
      where: {
        id_conversation,
        lu: false,
        id_expediteur: { not: id_utilisateur }
      },
      data: { lu: true }
    });

    return success(res, 200, 'Messages', messages);
  } catch (err) {
    return error(res, 500, err.message);
  }
};
exports.getMessagesNonLus = async (req, res) => {
  try {
    // ✅ id_conversation est String (cuid)
    const id_conversation = String(req.params.id_conversation);
    const id_utilisateur = String(req.user.id_utilisateur);
    const non_lus = await prisma.message.count({
      where: {
        id_conversation,
        lu: false,
        id_expediteur: { not: id_utilisateur }
      }
    });
    return success(res, 200, 'Messages non lus', { non_lus });
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// ─── Envoyer un message ───────────────────────────────────────────────────────
exports.envoyerMessage = async (req, res) => {
  try {
    // ✅ id_conversation est String (cuid)
    const id_conversation = String(req.params.id_conversation);
    const { contenu } = req.body;
    const id_expediteur = String(req.user.id_utilisateur);
    const fichier = req.file;

    const message = await prisma.message.create({
      data: {
        conversation: { connect: { id_conversation } },
        expediteur: { connect: { id_utilisateur: id_expediteur } },
        contenu: contenu || null,
        fichier_url: fichier ? `/uploads/messages/${fichier.filename}` : null,
        fichier_nom: fichier ? fichier.originalname : null,
        fichier_type: fichier ? fichier.mimetype : null,
      },
      include: {
        expediteur: {
          select: { id_utilisateur: true, nom: true, prenom: true, role: true }
        }
      }
    });

    const io = req.app.get('io');

    // Émettre en temps réel
    io.to(`conv_${id_conversation}`).emit('new_message', message);

    // Notifier les participants
    const conversation = await prisma.conversation.findUnique({
      where: { id_conversation },
      include: { participants: true }
    });

    conversation.participants.forEach(p => {
      if (p.id_utilisateur !== id_expediteur) {
        io.to(`user:${p.id_utilisateur}`).emit('notif_message', {
          id_conversation,
          expediteur: `${message.expediteur.prenom} ${message.expediteur.nom}`,
          apercu: contenu ? contenu.substring(0, 50) : '📎 Fichier joint',
          created_at: message.created_at
        });
      }
    });

    return success(res, 201, 'Message envoyé', message);
  } catch (err) {
    return error(res, 500, err.message);
  }
};