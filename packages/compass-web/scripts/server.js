const express = require('express');
const path = require('path');
const fs = require('fs');
const { createWebSocketProxy } = require('./ws-proxy');

const logger = console;
const app = express();
const PORT = 8080;

let cleaningUp = false;
let distPath;

if (fs.existsSync(path.join(__dirname, 'dist'))) {
  distPath = path.join(__dirname, 'dist');
} else {
  distPath = path.join(__dirname, '../', 'dist');
}

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  const host = server.address().address;
  const port = server.address().port;
  logger.info(`Server is listening on ${host}:${port}`);

  const wsProxyServer = createWebSocketProxy(server);

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (cleaningUp) {
        return false;
      }

      cleaningUp = true;
      logger.log('Cleaning up before exit');

      void Promise.allSettled([
        server.closeAllConnections(),
        new Promise((resolve) => {
          server.close(resolve);
        }),

        Array.from(wsProxyServer.clients.values()).map((ws) => {
          return ws.terminate();
        }),
        new Promise((resolve) => {
          wsProxyServer.close(resolve);
        }),
      ]).finally(() => {
        logger.log('Done cleaning up');
        process.exitCode = 0;
        process.exit();
      });
    });
  }

  [process.stdout, process.stderr].forEach((stream) => {
    stream.on('error', (err) => {
      logger.error(err);
    });
  });
});
