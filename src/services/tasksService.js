const {
  listTasksByUserId,
  createTask,
  updateTask,
  deleteTask,
} = require('../repositories/tasksRepository');

const getTasks = async (pool, userId) => {
  const tasks = await listTasksByUserId(pool, userId);
  return { status: 200, body: tasks };
};

const addTask = async (pool, userId, payload) => {
  const title = String(payload?.title || '').trim();

  if (!title) {
    return { status: 400, body: { message: 'El título es obligatorio.' } };
  }

  try {
    const task = await createTask(pool, userId, {
      title,
      completed: payload?.completed,
      completedAt: payload?.completedAt,
      important: payload?.important,
      estimatedTime: payload?.estimatedTime,
      categories: payload?.categories,
    });

    return { status: 201, body: task };
  } catch {
    return { status: 500, body: { message: 'No se pudo crear la tarea.' } };
  }
};

const editTask = async (pool, userId, taskId, payload) => {
  if (!Number.isInteger(taskId)) {
    return { status: 400, body: { message: 'ID de tarea inválido.' } };
  }

  try {
    const task = await updateTask(pool, userId, taskId, {
      title: payload?.title !== undefined ? String(payload.title).trim() : null,
      completed: payload?.completed !== undefined ? Boolean(payload.completed) : null,
      completedAt: payload?.completedAt !== undefined ? payload.completedAt : null,
      important: payload?.important !== undefined ? Boolean(payload.important) : null,
      estimatedTime: payload?.estimatedTime !== undefined ? payload.estimatedTime : null,
      categories:
        payload?.categories !== undefined
          ? JSON.stringify(Array.isArray(payload.categories) ? payload.categories : [])
          : null,
    });

    if (!task) {
      return { status: 404, body: { message: 'Tarea no encontrada.' } };
    }

    return { status: 200, body: task };
  } catch {
    return { status: 500, body: { message: 'No se pudo actualizar la tarea.' } };
  }
};

const removeTask = async (pool, userId, taskId) => {
  if (!Number.isInteger(taskId)) {
    return { status: 400, body: { message: 'ID de tarea inválido.' } };
  }

  try {
    const deleted = await deleteTask(pool, userId, taskId);
    if (!deleted) {
      return { status: 404, body: { message: 'Tarea no encontrada.' } };
    }

    return { status: 204, body: null };
  } catch {
    return { status: 500, body: { message: 'No se pudo eliminar la tarea.' } };
  }
};

module.exports = { getTasks, addTask, editTask, removeTask };
