const createUser = async (pool, { name, email, passwordHash }) => {
  const result = await pool.query(
    `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email;
    `,
    [name, email, passwordHash]
  );

  return result.rows[0];
};

const findUserByEmail = async (pool, email) => {
  const result = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  return result.rows[0] || null;
};

module.exports = { createUser, findUserByEmail };
