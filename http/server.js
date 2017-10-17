const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const mustache = require('mustache');
const log = require('./../log.js');
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

    this.enableHttpRedirect();
    this.specifyRoutes();

    // HTTP server, just to redirect to HTTPS
    http.createServer(this.app).listen(httpConfig.port);

    // HTTPS server
    const credentials = {
      key: fs.readFileSync(httpConfig.key),
      cert: fs.readFileSync(httpConfig.cert)
    };
    this.httpsServer = https.createServer(credentials, this.app);
    this.httpsServer.listen(httpConfig.portSecure);

    this.templateData = {};
  }

  /**
   * Configures Helmet rules to increase web app secuirty
   * @param {string} hostname whitelisted hostname for websocket connection
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
    // Disables external resourcers
    this.app.use(helmet.contentSecurityPolicy({
      directives: {
        // eslint-disable-next-line
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ['wss://' + hostname]
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
    this.app.use(bodyParser.json());
    this.app.get('/', (req, res) => this.oAuthAuthorize(req, res));
    this.app.use(express.static(path.join(__dirname, '../public')));
    this.app.use(express.static('public'));
    this.app.get('/callback', (emitter, code) => this.oAuthCallback(emitter, code));
    // eslint-disable-next-line
    this.router = express.Router();
    this.router.use((req, res, next) => this.jwtVerify(req, res, next));
    this.app.use('/api', this.router);
    this.router.use('/runs', this.runs);
    this.app.use('/jquery', express.static(path.join(__dirname, '../../../jquery/dist')));
    this.app.use('/jquery-ui', express.static(
      path.join(__dirname, '../../../jquery-ui-dist/')
    ));
  }

  /** Adds POST route
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  post(path, callback) {
    this.router.post(path, callback);
  }

  /** Adds POST route without authentication
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  postNoAuth(path, callback) {
    this.app.post(path, callback);
  }

  /** Adds DELETE route without authentication
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  deleteNoAuth(path, callback) {
    this.app.delete(path, callback);
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
        data.personid += Math.floor(Math.random() * 100);
        const params = JSON.parse(new Buffer(req.query.state, 'base64').toString('ascii'));
        Object.keys(params).forEach((key) => {
          data[key] = params[key];
        });
        data.token = this.jwt.generateToken(data.personid, data.username, 1);
        Object.assign(data, this.templateData);
        console.log(data);
        return res.status(200).send(this.renderPage('public/index.tpl', data));
      }).catch((error) => {
        return res.redirect('/');
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
  get server() {
    return this.httpsServer;
  }

  /**
   * Verifies JWT token synchronously.
   * @todo use promises or generators to call it asynchronously!
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   * @param {function} next - passes control to next matching route
   */
  jwtVerify(req, res, next) {
    try {
      // console.log(req.query);
      const jwtFeedback = this.jwt.verify(req.query.token);
      req.decoded = jwtFeedback.decoded;
      next();
    } catch (err) {
      log.debug(this.constructor.name, ':', err.name);
      res.status(403).json({message: err.name});
    }
  }

  /**
   * For the test purposes.
   * Simply returns JSON encoded fixed run number.
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  runs(req, res) {
    res.json({run: 123});
  }
}
module.exports = HttpServer;
