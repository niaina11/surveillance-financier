const express = require('express');
const router = express.Router();
const agenceCtrl = require('../controllers/admin/agence.controller');
const operationCtrl = require('../controllers/admin/operation.controller');
const rapportCtrl = require('../controllers/admin/rapport.controller');
const demandeCtrl = require('../controllers/admin/demande.controller');
const alertCtrl = require('../controllers/admin/alert.controller');
const dashCtrl = require('../controllers/admin/dashboard.controller');
const notifController = require('../controllers/admin/notification.controller');
const { auth } = require('../middleware/auth');

router.post('/agences',auth, agenceCtrl.creerAgence);
router.put('/update-agence/:id_agence', auth, agenceCtrl.modifierAgence);
router.get('/alertes', auth, alertCtrl.getAlertes);
router.get('/getAgences', auth, agenceCtrl.listerAgences);
router.get('/nombreAgences', auth, dashCtrl.getNombreAgences);
router.get('/nombreAgents', auth, dashCtrl.getNombreAgents);
router.get('/soldeParAgence', auth, dashCtrl.soldeParAgence);
router.get('/recette', auth, dashCtrl.getRecette);
router.get('/depense', auth, dashCtrl.getDepense);
router.get('/evolution-mensuelle', auth, dashCtrl.evolutionMensuelle);

//router.get('/operations', operationCtrl.listerOperationsAgence); // admin voit tout

router.get('/rapports',auth, rapportCtrl.genererRapport);

router.get('/demandes', demandeCtrl.listerDemandes);
router.patch('/demandes/:id', demandeCtrl.traiterDemande);
router.get('/mes_notifications', auth, notifController.mesNotifications);
router.patch('/:id_notification/lire', auth, notifController.marquerCommeLue);

module.exports = router;