const { pool } = require('../db/pool');
const { registerUser, loginUser } = require('../services/authService');

const register = async (req, res) => {
  const result = await registerUser(pool, req.body);
  return res.status(result.status).json(result.body);
};

const login = async (req, res) => {
  const result = await loginUser(pool, req.body);
  return res.status(result.status).json(result.body);
};

module.exports = { register, login };
