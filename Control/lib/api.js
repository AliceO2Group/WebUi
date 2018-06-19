const {log, WebSocketMessage} = require('@aliceo2/web-ui');

const Padlock = require('./Padlock.js');
const ControlProxy = require('./ControlProxy.js');
const config = require('./configProvider.js');

if (!config.grpc) {
  throw new Error('grpc field in config file is needed');
}

const pad = new Padlock();
const octl = new ControlProxy(config.grpc);

module.exports.attachTo = (http, ws) => {
  http.post('/getEnvironments', (req, res) => {
    octl.getEnvironments(req.body)
      .then((environments) => res.json(environments))
      .catch((error) => res.status(500).json({message: error.message}));
  });

  http.post('/controlEnvironment', (req, res) => {
    octl.controlEnvironment(req.body)
      .then((environments) => res.json(environments))
      .catch((error) => res.status(500).json({message: error.message}));
  });

  http.post('/newEnvironment', (req, res) => {
    octl.newEnvironment(req.body)
      .then((environment) => res.json(environment))
      .catch((error) => res.status(500).json({message: error.message}));
  });

  http.post('/destroyEnvironment', (req, res) => {
    octl.destroyEnvironment(req.body)
      .then((environment) => res.json(environment))
      .catch((error) => res.status(500).json({message: error.message}));
  });

  http.post('/getEnvironment', (req, res) => {
    octl.getEnvironment(req.body)
      .then((environment) => res.json(environment))
      .catch((error) => res.status(500).json({message: error.message}));
  });

  http.post('/getRoles', (req, res) => {
    octl.getRoles(req.body)
      .then((roles) => res.json(roles))
      .catch((error) => res.status(500).json({message: error.message}));
  });

  http.post('/getFrameworkInfo', (req, res) => {
    octl.getFrameworkInfo(req.body)
      .then((roles) => res.json(roles))
      .catch((error) => res.status(500).json({message: error.message}));
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

  const broadcastPadState = () => {
    const msg = new WebSocketMessage();
    msg.command = 'padlock-update';
    msg.payload = pad;
    ws.broadcast(msg);
  };
};
