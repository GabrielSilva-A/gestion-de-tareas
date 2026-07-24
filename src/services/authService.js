const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { createUser, findUserByEmail } = require('../repositories/usersRepository');

const createToken = (user) => {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (pool, payload) => {
  const name = String(payload?.name || '').trim();
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '');

  if (!name || !email || !password) {
    return { status: 400, body: { message: 'name, email y password son obligatorios.' } };
  }

  if (password.length < 6) {
    return { status: 400, body: { message: 'La contraseña debe tener al menos 6 caracteres.' } };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser(pool, { name, email, passwordHash });
    const token = createToken(user);

    return { status: 201, body: { user, token } };
  } catch (error) {
    if (error.code === '23505') {
      return { status: 409, body: { message: 'Ya existe un usuario con ese email.' } };
    }

    return { status: 500, body: { message: 'No se pudo registrar el usuario.' } };
  }
};

const loginUser = async (pool, payload) => {
  const email = String(payload?.email || '').trim().toLowerCase();
  const password = String(payload?.password || '');

  if (!email || !password) {
    return { status: 400, body: { message: 'email y password son obligatorios.' } };
  }

  try {
    const userRow = await findUserByEmail(pool, email);
    if (!userRow) {
      return { status: 401, body: { message: 'Credenciales inválidas.' } };
    }

    const isValidPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!isValidPassword) {
      return { status: 401, body: { message: 'Credenciales inválidas.' } };
    }

    const user = { id: userRow.id, name: userRow.name, email: userRow.email };
    const token = createToken(user);

    return { status: 200, body: { user, token } };
  } catch {
    return { status: 500, body: { message: 'No se pudo iniciar sesión.' } };
  }
};

module.exports = { registerUser, loginUser };
