const express = require('express');
const router = express.Router();
const operationCtrl = require('../controllers/agence/operation.controller');
const demandeCtrl = require('../controllers/agence/demande.controller');
const caisseCtrl = require('../controllers/agence/caisse.controller');
const depenseCtrl = require('../controllers/agence/depense.controller');
const dashboardCtrl = require('../controllers/agence/dash.controller');
const { auth } = require('../middleware/auth');

router.get('/caisse', caisseCtrl.getSolde);

router.post('/depenses', auth, depenseCtrl.creerDepense);
router.get('/depenses', depenseCtrl.listerDepenses);
router.post('/demandes/modification', auth, demandeCtrl.soumettreDemandeModification);

router.post('/demandes', auth, demandeCtrl.faireDemande);
router.get('/demandes',auth, demandeCtrl.mesDemandes);
router.get('/all_demandes', auth, demandeCtrl.allDemandes);
router.post('/operations', auth, operationCtrl.effectuerOperation);
router.get('/operations', auth, operationCtrl.mesOperations); 
router.get('/operations/agence/:id_agence', operationCtrl.listerOperationsAgence);
router.get('/all_operations', auth, operationCtrl.getAllOperation);
router.put('/operations/:id/annuler', operationCtrl.annulerOperation);
router.patch('/demandes/:id_demande/valider', auth, demandeCtrl.validerDemande);
router.patch('/demandes/:id_demande/refuser', auth, demandeCtrl.refuserDemande);
router.get('/getDepense', auth, dashboardCtrl.getDepense);
router.get('/getRecette', auth, dashboardCtrl.getRecette);
router.get('/getSolde', auth, dashboardCtrl.soldeActu);
router.post('/updateOp', auth, operationCtrl.updateOperation);

module.exports = router;