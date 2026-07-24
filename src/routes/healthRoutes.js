const express = require('express');
const { health } = require('../controllers/healthController');

const healthRoutes = express.Router();

healthRoutes.get('/health', health);

module.exports = { healthRoutes };
