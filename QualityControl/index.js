// Doc: https://github.com/winstonjs/winston/tree/2.x
// const winston = require('winston');
// const log = new winston.Logger({
//   transports: [
//     new winston.transports.Console(
//       {timestamp: true, colorize: true}
//     )
//   ],
//   exitOnError: true
// });

const HttpServer = require('@aliceo2/aliceo2-gui').HttpServer;
const log = require('@aliceo2/aliceo2-gui').Log;
const Response = require('@aliceo2/aliceo2-gui').Response;
const mysql = require('mysql');
const fs = require('fs');
const model = require('./lib/QCModelStatic.js');
const config = require('./config.js');

// Not working
// const log2 = require('@aliceo2/aliceo2-gui').Log;
// log2.configure({
//   winston: {
//     transports: [
//       new winston.transports.Console(
//         {timestamp: true, colorize: true}
//       )
//     ],
//     exitOnError: true
//   }
// });

// process.once('uncaughtException', function(e) {
//   if (e.code === 'EADDRINUSE') {
//     log.error('Port is already used');
//   }

//   log.error(e.stack || e);
//   process.exit(1);
// });

// Quick check config at start
log.info(`HTTP full link: http://${config.http.hostname}:${config.http.port}`);
log.info(`HTTPS full link: https://${config.http.hostname}:${config.http.portSecure}`);
log.info(`TObject2JSON URL: ${config.tobject2json.endpoint}`);

// Start servers
const http = new HttpServer(config.http, config.jwt, config.oAuth);

// Retrieve a TObject from the TObject2JSON server
// and send it to client
http.post('/readObject', function(req, res) {
  const path = req.query.path;

  if (!path) {
    return res.status(400).send('parameter path is needed');
  }

  model.readObject(path)
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(err => res.status(500).send(err));
});

http.post('/readObjectData', function(req, res) {
  const objectName = req.query.objectName;

  if (!objectName) {
    return res.status(400).send('parameter objectName is needed');
  }

  model.readObjectData(objectName)
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(err => res.status(500).send(err));
});

http.post('/listObjects', function(req, res) {
  model.listObjects()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).send(err));
});

http.post('/readLayout', function(req, res) {
  const layoutName = req.query.layoutName;

  if (!layoutName) {
    return res.status(400).send('layoutName parameter is needed');
  }

  model.readLayout(layoutName)
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch(err => res.status(500).send(err));
});

http.post('/listLayouts', function(req, res) {
  model.listLayouts()
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).send(err));
});

http.addStaticPath('public');
http.addStaticPath('node_modules/jsroot', 'jsroot');

