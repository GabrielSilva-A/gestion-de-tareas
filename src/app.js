const express = require('express');
const cors = require('cors');
const path = require('path');
const { env } = require('./config/env');
const { authRoutes } = require('./routes/authRoutes');
const { tasksRoutes } = require('./routes/tasksRoutes');
const { healthRoutes } = require('./routes/healthRoutes');

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const app = express();

const corsOptions = env.FRONTEND_ORIGIN ? { origin: env.FRONTEND_ORIGIN } : undefined;

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(clientDistPath));

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

module.exports = { app };
