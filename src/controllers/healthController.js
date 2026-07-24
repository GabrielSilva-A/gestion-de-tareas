const { pool } = require('../db/pool');

const health = async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', message: 'Backend de gestión de tareas listo' });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Sin conexión a base de datos' });
  }
};

module.exports = { health };
