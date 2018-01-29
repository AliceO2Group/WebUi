const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const log = require('./../log/log.js');
const JwtToken = require('./../jwt/token.js');
const OAuth = require('./oauth.js');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');
const url = require('url');

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
        defaultSrc: ["'self'", "data:"],
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
   * Handles oAuth authentication flow (default path of the app: '/')
   * - If query.code is valid embeds the token and grants the access to the application
   * - Redirects to the OAuth flow if query.code is not present (origin path != /callback)
   * - Prints out an error when code is not valid
   * The query arguments are serialized and kept in the 'state' parameter through OAuth process
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  oAuthAuthorize(req, res) {
    const code = req.query.code; // OAuth code
    const query = req.query; // User's arguments
    delete query.code; // Don't keep code, it's not an user's argument

    if (!code) {
      // Redirects to the OAuth flow
      const state = new Buffer(JSON.stringify(query)).toString('base64');
      res.redirect(this.oauth.getAuthorizationUri(state));
    }

    this.oauth.oAuthCallback(code)
      .then((details) => {
        // Generates random user id (for the test purposes)
        // To emulate two different users connecting to the app)
        details.user.personid += Math.floor(Math.random() * 100);

        // Append query parameter to the details object which is passed to the front-end template
        details.query = query;

        // Adds token to the details object
        details.token = this.jwt.generateToken(details.user.personid, details.user.username, 1);

        // Concatanates details from oAuth flow with data directly passed by user
        Object.assign(details, this.templateData);

        // Renders the app
        return res.status(200).send(fs.readFileSync(page).toString());
      })
      .catch((error) => {
        // Handles invalid oAuth code parameters
        log.warn(error);
        res.status(401).send(
          `OAuth failed: ${error.message}, beware refreshing the page with one-time code parameter`
        );
      });
  }

  /**
   * oAuth allback route - when successfully authorized (/callback)
   * Redirects to the application deserializes the query parameters from state variable
   * and injects them to the url
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   * @return {object} redirect to address with re-included query string
   */
  oAuthCallback(req, res) {
    const code = req.query.code;
    const state = req.query.state; // base64
    if (!code || !state) {
      return res.status(400).send('code and state required');
    }

    // Reinject the saved query args into the final URL
    const query = JSON.parse(new Buffer(state, 'base64').toString('ascii'));
    query.code = code;
    const homeUrlAuthentified = url.format({pathname: '/', query: query});

    return res.redirect(homeUrlAuthentified);
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
