const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const agenceRoutes = require('./routes/agence.routes');
const messagerieRoutes = require('./routes/messagerie.routes');
const path = require('path');


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agence', agenceRoutes);
app.use('/api/audit', require('./routes/audit.routes'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/messagerie', messagerieRoutes);

app.get('/', (req, res) => res.send('API Gestion Caisse OK'));

module.exports = app;