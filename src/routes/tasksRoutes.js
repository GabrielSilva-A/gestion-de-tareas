const express = require('express');
const { list, create, update, remove } = require('../controllers/tasksController');
const { authRequired } = require('../middlewares/authRequired');

const tasksRoutes = express.Router();

tasksRoutes.use(authRequired);
tasksRoutes.get('/', list);
tasksRoutes.post('/', create);
tasksRoutes.patch('/:id', update);
tasksRoutes.delete('/:id', remove);

module.exports = { tasksRoutes };
