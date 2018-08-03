const {log, WebSocket, WebSocketMessage} = require('@aliceo2/web-ui');
const config = require('./configProvider.js');

// Load data source (demo or DB)
const model = config.demoData ? require('./QCModelDemo.js') : require('./QCModel.js');

module.exports.setup = (http) => {
  http.post('/readObjectData', readObjectData);
  http.post('/readObjectsData', readObjectsData);
  http.post('/listObjects', listObjects);
  http.post('/readLayout', readLayout);
  http.post('/writeLayout', updateLayout);
  http.post('/listLayouts', listLayouts);
  http.delete('/layout/:name', deleteLayout);
  http.post('/layout', createLayout);

  const ws = new WebSocket(http);
  model.informationService.on('updated', (state) => {
    const message = new WebSocketMessage(200);
    message.command = 'information-service';
    message.payload = state;
    ws.broadcast(message);
  });
};

/**
 * List all objects without data
 * @param {Request} req
 * @param {Response} res
 */
function listObjects(req, res) {
  model.listObjects()
    .then((data) => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * List objects with data specified by objectName[]
 * Send back array of objects or {error: ...}
 * @param {Request} req
 * @param {Response} res
 */
function readObjectsData(req, res) {
  let objectsNames = req.body.objectsNames;

  if (!objectsNames) {
    res.status(400).send('parameter objectsNames is needed');
    return;
  }

  if (!Array.isArray(objectsNames)) {
    objectsNames = [objectsNames];
  }

  // Retrieve data, in case of error or not found, put message on 'error' field
  const safeRetriever = (name) => model.readObjectData(name)
    .then((data) => !data ? {error: 'Object not found'} : data)
    .catch((err) => ({error: err}));

  const promiseArray = objectsNames.map(safeRetriever);
  Promise.all(promiseArray)
    .then((results) => {
      const resultsByName = {};
      objectsNames.forEach((name, i) => {
        resultsByName[name] = results[i];
      });
      res.status(200).json(resultsByName);
    })
    .catch((err) => errorHandler(err, res));
}

/**
 * Read only data of an object specified by objectName
 * @param {Request} req
 * @param {Response} res
 */
function readObjectData(req, res) {
  const objectName = req.query.objectName;

  if (!objectName) {
    res.status(400).send('parameter objectName is needed');
    return;
  }

  model.readObjectData(objectName)
    .then((data) => res.status(data ? 200 : 404).json(data))
    .catch((err) => errorHandler('Reading object data: ' + err, res));
}

/**
 * List all layouts, can be filtered by owner_id
 * @param {Request} req
 * @param {Response} res
 */
function listLayouts(req, res) {
  let filter = {};
  if (req.body.owner_id !== undefined) {
    filter.owner_id = parseInt(req.body.owner_id, 10);
  }

  model.listLayouts(filter)
    .then((data) => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * Read a single layout specified by layoutName
 * @param {Request} req
 * @param {Response} res
 */
function readLayout(req, res) {
  const layoutName = req.body.layoutName;

  if (!layoutName) {
    res.status(400).send('layoutName parameter is needed');
    return;
  }

  model.readLayout(layoutName)
    .then((data) => res.status(data ? 200 : 404).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * Update a single layout specified by layoutName and body
 * @param {Request} req
 * @param {Response} res
 */
function updateLayout(req, res) {
  const layoutName = req.query.layoutName;
  const data = req.body;

  if (!layoutName) {
    res.status(400).send('layoutName parameter is needed');
    return;
  }

  if (!data) {
    res.status(400).send('body is needed');
    return;
  }

  model.updateLayout(layoutName, data)
    .then((data) => res.status(200).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * Delete a single layout specified by name
 * @param {Request} req
 * @param {Response} res
 */
function deleteLayout(req, res) {
  const layoutName = req.params.name;

  if (!layoutName) {
    res.status(400).send('layoutName is needed');
    return;
  }

  model.deleteLayout(layoutName)
    .then((data) => res.status(204).json(data))
    .catch((err) => errorHandler(err, res));
}

/**
 * Create a layout specified by body
 * @param {Request} req
 * @param {Response} res
 */
function createLayout(req, res) {
  const layout = req.body;

  if (!layout.name) {
    res.status(400).send('layout.name parameter is needed');
    return;
  }
  if (layout.owner_id === undefined) { // integer from 0 to Infinity
    res.status(400).send('layout.owner_id parameter is needed');
    return;
  }
  if (!layout.owner_name) {
    res.status(400).send('layout.owner_name parameter is needed');
    return;
  }
  if (!layout.tabs) {
    res.status(400).send('layout.tabs parameter is needed');
    return;
  }

  model.createLayout(layout)
    .then((data) => res.status(201).json(data))
    .catch((err) => errorHandler(err, res, 409));
}

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (status === 500) {
    if (err.stack) {
      log.trace(err);
    }
    log.error(err.message || err);
  }
  res.status(status).send({error: err.message || err});
}
