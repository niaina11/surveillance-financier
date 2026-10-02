const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/getAgencesPublic', authController.listerAgencesPublic);

// Admin seulement
router.get('/comptes', auth, authController.listerTousLesComptes);
router.get('/comptes/attente', auth, authController.listerComptesEnAttente);
router.put('/comptes/:id/valider', auth, authController.validerCompte);
router.put('/comptes/:id/rejeter', auth, authController.rejeterCompte);

module.exports = router;