const log = require('@aliceo2/web-ui').Log;
let model; // lazy loaded on setup

module.exports.setup = (config, http) => {
  // Load data source (demo or DB)
  model = config.demoData ? require('./QCModelDemo.js') : require('./QCModel.js');

  http.post('/readObjectData', readObjectData);
  http.get('/readObjectsData', readObjectsData);
  http.post('/listObjects', listObjects);
  http.post('/readLayout', readLayout);
  http.post('/writeLayout', writeLayout);
  http.get('/layout', listLayouts);
  http.delete('/layout/:name', deleteLayout);
  http.post('/layout', createLayout);
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
 * @param {Request} req
 * @param {Response} res
 */
function readObjectsData(req, res) {
  let objectName = req.query.objectName;

  if (!objectName) {
    res.status(400).send('parameter objectName is needed');
    return;
  }

  if (!Array.isArray(objectName)) {
    objectName = [objectName];
  }

  // Retrieve all data and fill a key-value object with it
  const safeRetriever = (name) => model.readObjectData(name).catch((err) => errorHandler(err, res));
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
    .catch((err) => errorHandler(err, res));
}

/**
 * List all layouts, can be filtered by owner_id
 * @param {Request} req
 * @param {Response} res
 */
function listLayouts(req, res) {
  const filter = {
    owner_id: parseInt(req.query.owner_id, 10)
  };

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
  const layoutName = req.query.layoutName;

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
function writeLayout(req, res) {
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

  model.writeLayout(layoutName, data)
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
  if (!layout.owner_id) {
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
    .catch((err) => errorHandler(err, res));
}

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 */
function errorHandler(err, res) {
  log.error(err);
  res.status(500).send();
}
