const { createServer, closeServer } = require('./infoLoggerServer.js');

const server = createServer();

['SIGTERM', 'SIGINT', 'SIGHUP'].forEach((event) => process.on(event, async () => {
  try {
    await closeServer(server);
    process.exit(0);
  } catch {
    process.exit(1);
  }
}));
