const { app } = require('./app');
const { env } = require('./config/env');
const { pool } = require('./db/pool');
const { initializeDatabase } = require('./db/init');

const startServer = async () => {
  await initializeDatabase(pool);

  app.listen(env.PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${env.PORT}`);
  });
};

module.exports = { startServer };
