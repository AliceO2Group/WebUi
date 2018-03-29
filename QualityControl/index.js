const HttpServer = require('@aliceo2/aliceo2-gui').HttpServer;
const log = require('@aliceo2/aliceo2-gui').Log;
const Response = require('@aliceo2/aliceo2-gui').Response;
const mysql = require('mysql');
const fs = require('fs');
const config = require('./config.js');
const validator = require('./lib/validator.js');
const model = config.app.demoData ? require('./lib/QCModelDemo.js') : require('./lib/QCModel.js');

// Quick check config at start
log.info(`HTTP full link: http://${config.http.hostname}:${config.http.port}`);
log.info(`HTTPS full link: https://${config.http.hostname}:${config.http.portSecure}`);
log.info(`TObject2JSON URL: ${config.tobject2json.endpoint}`);

// Start servers
const http = new HttpServer(config.http, config.jwt, config.oAuth);
http.addStaticPath('public');
http.addStaticPath('node_modules/jsroot', 'jsroot');

// --------------------------------------------------------
// API
// --------------------------------------------------------

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

http.post('/writeLayout', function(req, res) {
  const layoutName = req.query.layoutName;
  const data = req.body;

  if (!layoutName) {
    return res.status(400).send('layoutName parameter is needed');
  }

  if (!data) {
    return res.status(400).send('body is needed');
  }

  model.writeLayout(layoutName, data)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).send(err));
});

http.get('/layout', function(req, res) {
  const filter = {
    owner_id: parseInt(req.query.owner_id, 10)
  };

  model.listLayouts(filter)
    .then(data => res.status(200).json(data))
    .catch(err => res.status(500).send(err));
});

http.post('/layout', function(req, res) {
  const layout = req.body;

  if (!layout.name) {
    return res.status(400).send('layout.name parameter is needed');
  }
  if (!layout.owner_id) {
    return res.status(400).send('layout.owner_id parameter is needed');
  }
  if (!layout.owner_name) {
    return res.status(400).send('layout.owner_name parameter is needed');
  }
  if (!layout.tabs) {
    return res.status(400).send('layout.tabs parameter is needed');
  }
  validator.layout(layout);

  model.createLayout(layout)
    .then(data => res.status(201).json(data))
    .catch(err => res.status(500).send(err));
});

