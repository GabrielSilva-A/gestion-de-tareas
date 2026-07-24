const mapTaskRow = (task) => ({
  id: Number(task.id),
  title: task.title,
  completed: task.completed,
  completedAt: task.completed_at,
  important: task.important,
  estimatedTime: task.estimated_time,
  categories: Array.isArray(task.categories) ? task.categories : [],
  createdAt: task.created_at,
  updatedAt: task.updated_at,
});

const listTasksByUserId = async (pool, userId) => {
  const result = await pool.query(
    `
      SELECT id, title, completed, completed_at, important, estimated_time, categories, created_at, updated_at
      FROM tasks
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `,
    [userId]
  );

  return result.rows.map(mapTaskRow);
};

const createTask = async (pool, userId, taskInput) => {
  const result = await pool.query(
    `
      INSERT INTO tasks (user_id, title, completed, completed_at, important, estimated_time, categories)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING id, title, completed, completed_at, important, estimated_time, categories, created_at, updated_at;
    `,
    [
      userId,
      taskInput.title,
      Boolean(taskInput.completed),
      taskInput.completedAt || null,
      Boolean(taskInput.important),
      taskInput.estimatedTime || null,
      JSON.stringify(Array.isArray(taskInput.categories) ? taskInput.categories : []),
    ]
  );

  return mapTaskRow(result.rows[0]);
};

const updateTask = async (pool, userId, taskId, updates) => {
  const result = await pool.query(
    `
      UPDATE tasks
      SET
        title = COALESCE($3, title),
        completed = COALESCE($4, completed),
        completed_at = CASE
          WHEN $4 IS NULL THEN COALESCE($5, completed_at)
          WHEN $4 = TRUE THEN COALESCE($5, NOW())
          ELSE NULL
        END,
        important = COALESCE($6, important),
        estimated_time = COALESCE($7, estimated_time),
        categories = COALESCE($8::jsonb, categories),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id, title, completed, completed_at, important, estimated_time, categories, created_at, updated_at;
    `,
    [
      taskId,
      userId,
      updates.title,
      updates.completed,
      updates.completedAt,
      updates.important,
      updates.estimatedTime,
      updates.categories,
    ]
  );

  return result.rows[0] ? mapTaskRow(result.rows[0]) : null;
};

const deleteTask = async (pool, userId, taskId) => {
  const result = await pool.query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
    [taskId, userId]
  );

  return Boolean(result.rows[0]);
};

module.exports = {
  listTasksByUserId,
  createTask,
  updateTask,
  deleteTask,
};
