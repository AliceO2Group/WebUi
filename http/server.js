const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const mustache = require('mustache');
const log = require('./../log/log.js');
const JwtToken = require('./../jwt/token.js');
const OAuth = require('./oauth.js');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');

/**
 * HTTPS server that handles OAuth and provides REST API.
 * Each request is authenticated with JWT token.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class HttpServer {
  /**
   * Sets up the server, routes and binds HTTP and HTTPS sockets.
   * @param {object} httpConfig - configuration of HTTP server
   * @param {object} jwtConfig - configuration of JWT
   * @param {object} oAuthConfig - configuration of oAuth
   */
  constructor(httpConfig, jwtConfig, oAuthConfig) {
    this.app = express();
    this.app.use(compression());
    this.configureHelmet(httpConfig.hostname);

    this.app.use(express.static(path.join(__dirname, '')));

    this.jwt = new JwtToken(jwtConfig);
    this.oauth = new OAuth(oAuthConfig);
    this.specifyRoutes();

    if (httpConfig.tls) {
      const credentials = {
        key: fs.readFileSync(httpConfig.key),
        cert: fs.readFileSync(httpConfig.cert)
      };
      this.server = https.createServer(credentials, this.app).listen(httpConfig.portSecure);
      this.enableHttpRedirect();
    } else {
      this.server = http.createServer(this.app).listen(httpConfig.port);
    }

    this.templateData = {};
  }

  /**
   * Configures Helmet rules to increase web app secuirty
   * @param {string} hostname whitelisted hostname for websocket connection
   * @param {number} port secure port number
   */
  configureHelmet(hostname) {
    // Sets "X-Frame-Options: DENY" (doesn't allow to be in any iframe)
    this.app.use(helmet.frameguard({action: 'deny'}));
    // Sets "Strict-Transport-Security: max-age=5184000 (60 days) (stick to HTTPS)
    this.app.use(helmet.hsts({
      maxAge: 5184000
    }));
    // Sets "Referrer-Policy: same-origin"
    this.app.use(helmet.referrerPolicy({policy: 'same-origin'}));
    // Sets "X-XSS-Protection: 1; mode=block"
    this.app.use(helmet.xssFilter());
    // Removes X-Powered-By header
    this.app.use(helmet.hidePoweredBy());
    // Disable DNS prefetching
    this.app.use(helmet.dnsPrefetchControl());
    // Disables external resourcers
    this.app.use(helmet.contentSecurityPolicy({
      directives: {
        /* eslint-disable */
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'wss://' + hostname + ':*']
        /* eslint-enable */
      }
    }));
  }

  /**
   * Passes key-value that can be used in template
   * @param {string} key - allows to access value from temaplte
   * @param {string} value
   */
  passToTemplate(key, value) {
    this.templateData[key] = value;
  }

  /**
   * Specified routes and their callbacks.
   */
  specifyRoutes() {
    // eslint-disable-next-line
    this.router = express.Router();
    this.router.use((req, res, next) => this.jwtVerify(req, res, next));
    this.app.use(bodyParser.json());
    this.app.get('/', (req, res) => this.oAuthAuthorize(req, res));
    this.app.use(express.static(path.join(__dirname, '../public')));
    this.app.use(express.static('public'));
    this.app.get('/callback', (emitter, code) => this.oAuthCallback(emitter, code));
    this.app.use('/api', this.router);
  }

  /**
   * Adds GET route with authentification (req.query.token must be provided)
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  get(path, callback) {
    this.router.get(path, callback);
  }

  /**
   * Adds POST route with authentification (req.query.token must be provided)
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  post(path, callback) {
    this.router.post(path, callback);
  }

  /**
   * Adds DELETE route with authentification (req.query.token must be provided)
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  delete(path, callback) {
    this.router.delete(path, callback);
  }

  /**
   * Redirects HTTP to HTTPS.
   */
  enableHttpRedirect() {
    this.app.use(function(req, res, next) {
      if (!req.secure) {
        return res.redirect('https://' + req.headers.host + req.url);
      }
      next();
    });
  }

  /**
   * OAuth redirection.
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  oAuthAuthorize(req, res) {
    const state = new Buffer(JSON.stringify(req.query)).toString('base64');
    res.redirect(this.oauth.getAuthorizationUri(state));
  }

  /**
   * OAuth callback if authentication succeeds.
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  oAuthCallback(req, res) {
    this.oauth.oAuthCallback(req.query.code)
      .then((data) => {
        /* !!! JUST FOR DEVELOPMENT !!! */
        data[0].personid += Math.floor(Math.random() * 100);
        const params = JSON.parse(new Buffer(req.query.state, 'base64').toString('ascii'));
        Object.keys(params).forEach((key) => {
          data[0][key] = params[key];
        });
        data[0].token = this.jwt.generateToken(data[0].personid, data[0].username, 1);
        Object.assign(data[0], this.templateData);
        return res.status(200).send(this.renderPage('public/index.tpl', data[0]));
      }, (error) => {
        log.info(error.message);
        return res.status(401).send(error.message);
      }).catch(() => {
        return res.status(401).send('oAuth failed');
      });
  }

  /**
   * Renders template using Mustache engine.
   * @param {string} page - template file path
   * @param {object} data - data to fill the template with
   * @return {string} - HTML page
   */
  renderPage(page, data) {
    const template = fs.readFileSync(page).toString();
    return mustache.to_html(template, data);
  }

  /**
   * HTTPs server getter.
   * @return {object} - HTTPs server
   */
  get getServer() {
    return this.server;
  }

  /**
   * Verifies JWT token synchronously.
   * @todo use promises or generators to call it asynchronously!
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   * @param {function} next - passes control to next matching route
   */
  jwtVerify(req, res, next) {
    this.jwt.verify(req.query.token)
      .then((data) => {
        req.decoded = data.decoded;
        next();
      }, (err) => {
        log.debug(this.constructor.name, ':', err.name);
        res.status(403).json({message: err.name});
      });
  }
}
module.exports = HttpServer;
