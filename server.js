const { startServer } = require('./src/startServer');

startServer().catch((error) => {
  console.error('Error inicializando servidor:', error.message);
  process.exit(1);
});
