const {WebSocketMessage} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)('Control');
const {trace} = require('@aliceo2/web-ui').Log;

const Padlock = require('./Padlock.js');
const ControlProxy = require('./ControlProxy.js');
const config = require('./configProvider.js');

if (!config.grpc) {
  throw new Error('grpc field in config file is needed');
}

const pad = new Padlock();
const octl = new ControlProxy(config.grpc);
/* eslint-disable new-cap */
module.exports.attachTo = (http, ws) => {
  http.post('/GetEnvironments', (req, res) => {
    octl.GetEnvironments(req.body)
      .then((environments) => res.json(environments))
      .catch((error) => errorHandler(error, res));
  });

  http.post('/ControlEnvironment', (req, res) => {
    octl.ControlEnvironment(req.body)
      .then((environments) => res.json(environments))
      .catch((error) => errorHandler(error, res, 504));
  });

  http.post('/NewEnvironment', (req, res) => {
    octl.NewEnvironment(req.body)
      .then((environment) => res.json(environment))
      .catch((error) => errorHandler(error, res));
  });

  http.post('/DestroyEnvironment', (req, res) => {
    octl.DestroyEnvironment(req.body)
      .then((environment) => res.json(environment))
      .catch((error) => errorHandler(error, res));
  });

  http.post('/GetEnvironment', (req, res) => {
    octl.GetEnvironment(req.body)
      .then((environment) => res.json(environment))
      .catch((error) => errorHandler(error, res));
  });

  http.post('/GetFrameworkInfo', (req, res) => {
    octl.GetFrameworkInfo(req.body)
      .then((roles) => res.json(roles))
      .catch((error) => errorHandler(error, res));
  });
  /* eslint-enable no-use-before-define */
  http.post('/GetWorkflows', (req, res) => {
    octl.GetWorkflowTemplates(req.body)
      .then((workflows) => res.json(workflows))
      .catch((error) => errorHandler(error, res));
  });

  http.post('/lockState', (req, res) => {
    res.json(pad);
  });

  http.post('/lock', (req, res) => {
    try {
      pad.lockBy(req.session.personid, req.session.name);
      log.info(`Lock taken by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to take lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.toString()});
      return;
    }
    broadcastPadState();
  });

  http.post('/unlock', (req, res) => {
    try {
      pad.unlockBy(req.session.personid);
      log.info(`Lock given away by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to give away lock by ${req.session.name}: ${error}`);
      res.status(403).json(error);
      return;
    }
    broadcastPadState();
  });

  /**
   * Send to all users state of Pad via Websocket
   */
  const broadcastPadState = () => {
    const msg = new WebSocketMessage();
    msg.command = 'padlock-update';
    msg.payload = pad;
    ws.broadcast(msg);
  };
};

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500) {
  if (status > 500) {
    if (err.stack) {
      trace(err);
    }
    log.error(err.message || err);
  }
  res.status(status).send({message: err.message || err});
}
