const { pool } = require('../db/pool');
const { getTasks, addTask, editTask, removeTask } = require('../services/tasksService');

const list = async (req, res) => {
  try {
    const result = await getTasks(pool, req.user.id);
    return res.status(result.status).json(result.body);
  } catch {
    return res.status(500).json({ message: 'No se pudieron obtener las tareas.' });
  }
};

const create = async (req, res) => {
  const result = await addTask(pool, req.user.id, req.body);
  return res.status(result.status).json(result.body);
};

const update = async (req, res) => {
  const taskId = Number(req.params.id);
  const result = await editTask(pool, req.user.id, taskId, req.body);

  if (result.status === 204) {
    return res.status(204).send();
  }

  return res.status(result.status).json(result.body);
};

const remove = async (req, res) => {
  const taskId = Number(req.params.id);
  const result = await removeTask(pool, req.user.id, taskId);

  if (result.status === 204) {
    return res.status(204).send();
  }

  return res.status(result.status).json(result.body);
};

module.exports = { list, create, update, remove };
