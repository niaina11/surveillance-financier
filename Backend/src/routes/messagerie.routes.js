const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/messagerie.controller');
const { auth } = require('../middleware/auth');

router.get('/utilisateurs', auth, ctrl.listeUtilisateurs);
router.get('/conversations', auth, ctrl.mesConversations);
router.post('/conversations/privee', auth, ctrl.ouvrirConversationPrivee);
router.post('/conversations/groupe', auth, ctrl.creerGroupe);
router.get('/conversations/:id_conversation/messages', auth, ctrl.getMessages);
router.get('/conversations/:id_conversation/messages/non-lus', auth, ctrl.getMessagesNonLus);
router.post(
  '/conversations/:id_conversation/messages',
  auth,
  ctrl.upload.single('fichier'),
  ctrl.envoyerMessage
);

module.exports = router;