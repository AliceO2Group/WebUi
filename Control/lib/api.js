const {WebSocketMessage} = require('@aliceo2/web-ui');
const log = new (require('@aliceo2/web-ui').Log)('Control');

const Padlock = require('./Padlock.js');
const ControlProxy = require('./ControlProxy.js');
const config = require('./configProvider.js');

if (!config.grpc) {
  throw new Error('grpc field in config file is needed');
}

const pad = new Padlock();
const octl = new ControlProxy(config.grpc);

module.exports.attachTo = (http, ws) => {
  // Map Control gRPC methods
  for (const method of octl.methods) {
    http.post(`/${method}`, (req, res) => {
      if (!octl.connectionReady) {
        errorHandler(`Could not establish gRPC connection to Control-Core`, res, 503);
        return;
      }
      // disallow 'not-Get' methods if not owning the lock
      if (!method.startsWith('Get')) {
        if (pad.lockedBy == null) {
          errorHandler(`Control is not locked`, res, 403);
          return;
        }
        if (req.session.personid != pad.lockedBy) {
          errorHandler(`Control is locked by ${pad.lockedByName}`, res, 403);
          return;
        }
      }
      console.log("MTHOD IS")
      console.log(req.body);
      octl[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504));
    });
  }

  http.post('/lockState', (req, res) => {
    res.json(pad);
  });

  http.post('/lock', (req, res) => {
    try {
      pad.lockBy(req.session.personid, req.session.name);
      log.info(`Lock taken by ${req.session.name}`);
      res.json({ok: true});
    } catch (error) {
      log.warn(`Unable to lock by ${req.session.name}: ${error}`);
      res.status(403).json({message: error.toString()});
      return;
    }
    broadcastPadState();
  });

  http.post('/unlock', (req, res) => {
    try {
      pad.unlockBy(req.session.personid);
      log.info(`Lock released by ${req.session.name}`);
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
    ws.broadcast(
      new WebSocketMessage().setCommand('padlock-update').setPayload(pad)
    );
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
      log.trace(err);
    }
    log.error(err.message || err);
  }
  res.status(status).send({message: err.message || err});
}
