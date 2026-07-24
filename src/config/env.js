const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en variables de entorno.`);
  }
  return value;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || '',
};

module.exports = { env };
