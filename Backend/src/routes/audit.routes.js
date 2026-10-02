const express = require('express');
const router = express.Router();
const auditCtrl = require('../controllers/audit.controller');

router.post('/audits', auditCtrl.enregistrer);
router.get('/getAudits', auditCtrl.lister);
module.exports = router;