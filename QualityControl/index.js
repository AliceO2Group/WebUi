const HttpServer = require('@aliceo2/aliceo2-gui').HttpServer;
const log = require('@aliceo2/aliceo2-gui').Log;
const Response = require('@aliceo2/aliceo2-gui').Response;
const mysql = require('mysql');
const fs = require('fs');

// Reading config file
let configFile = './config.js';console.log(process.argv)
if (process.argv.length >= 3) {
  configFile = process.argv[2];
}

try {
  configFile = fs.realpathSync(configFile);
} catch (err) {
  log.error(`Unable to read config file: ${err.message}`);
  process.exit(1);
}

log.info(`Reading config file "${configFile}"`);
const config = require(configFile);

// Load data source (demo or DB)
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

http.post('/readObjectData', function(req, res) {
  const objectName = req.query.objectName;

  if (!objectName) {
    return res.status(400).send('parameter objectName is needed');
  }

  model.readObjectData(objectName)
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch((err) => errorHandler(err, res));
});

http.get('/readObjectsData', function(req, res) {
  let objectName = req.query.objectName;

  if (!objectName) {
    return res.status(400).send('parameter objectName is needed');
  }

  if (!Array.isArray(objectName)) {
    objectName = [objectName];
  }

  // Retrieve all data and fill a key-value object with it
  const safeRetriever = (name) => model.readObjectData(name).catch((err) => null);
  const promiseArray = objectName.map(safeRetriever);
  Promise.all(promiseArray)
    .then((results) => {
      const resultsByName = {};
      objectName.forEach((name, i) => {
        resultsByName[name] = results[i];
      });
      res.status(200).json(resultsByName);
    })
    .catch((err) => errorHandler(err, res));
});

http.post('/listObjects', function(req, res) {
  model.listObjects()
    .then(data => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
});

http.post('/readLayout', function(req, res) {
  const layoutName = req.query.layoutName;

  if (!layoutName) {
    return res.status(400).send('layoutName parameter is needed');
  }

  model.readLayout(layoutName)
    .then(data => res.status(data ? 200 : 404).json(data))
    .catch((err) => errorHandler(err, res));
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
    .catch((err) => errorHandler(err, res));
});

http.get('/layout', function(req, res) {
  const filter = {
    owner_id: parseInt(req.query.owner_id, 10)
  };

  model.listLayouts(filter)
    .then(data => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
});

http.delete('/layout/:name', function(req, res) {
  const layoutName = req.params.name;

  if (!layoutName) {
    return res.status(400).send('layoutName is needed');
  }

  model.deleteLayout(layoutName)
    .then(data => res.status(204).json(data))
    .catch((err) => errorHandler(err, res));
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

  model.createLayout(layout)
    .then(data => res.status(201).json(data))
    .catch((err) => errorHandler(err, res));
});

function errorHandler(err, res) {
  console.error(err);
  res.status(500).send();
}

