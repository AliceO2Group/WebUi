const config = require('./../config.json');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const mustache = require('mustache');
const EventEmitter = require('events').EventEmitter;
const log = require('./../log.js');
const JwtToken = require('./../jwt/token.js');
const OAuth = require('./oauth.js');

const path = require('path');
const bodyParser = require('body-parser');
const app = express();


/**
 * HTTPS server that handles OAuth and provides REST API.
 * Each request is authenticated with JWT token.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class HttpServer {
  /**
   * Sets up the server, routes and binds HTTP and HTTPS sockets.
   * @param {object} app
   */
  constructor() {
    app.use(express.static(path.join(__dirname, '')));

    this.jwt = new JwtToken(config.jwt);
    this.oauth = new OAuth();

    this.enableHttpRedirect();
    this.specifyRoutes();

    // HTTP server, just to redirect to HTTPS
    http.createServer(app).listen(config.http.port);

    // HTTPS server
    const credentials = {
      key: fs.readFileSync(config.key),
      cert: fs.readFileSync(config.cert)
    };
    this.httpsServer = https.createServer(credentials, app);
    this.httpsServer.listen(config.http.portSecure);
  }

  /**
   * Specified routes and their callbacks.
   */
  specifyRoutes() {
    app.use(bodyParser.json());
    app.get('/', (req, res) => this.oAuthAuthorize(res));
    app.use(express.static('public'));
    app.use('/jquery', express.static(path.join(__dirname, '../node_modules/jquery/dist')));
    app.use('/jquery-ui', express.static(
      path.join(__dirname, '../node_modules/jquery-ui-dist/')
    ));
    app.get('/callback', (emitter, code) => this.oAuthCallback(emitter, code));
    // eslint-disable-next-line
    this.router = express.Router();
    this.router.use((req, res, next) => this.jwtVerify(req, res, next));
    app.use('/api', this.router);
    this.router.use('/runs', this.runs);
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
    app.post(path, callback);
  }

  /** Adds DELETE route without authentication
   * @param {string} path - path that the callback will be bound to
   * @param {function} callback - function (that receives req and res parameters)
   */
  deleteNoAuth(path, callback) {
    app.delete(path, callback);
  }

  /**
   * Redirects HTTP to HTTPS.
   */
  enableHttpRedirect() {
    app.use(function(req, res, next) {
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
  oAuthAuthorize(res) {
    res.redirect(this.oauth.authorizationUri);
  }

  /**
   * OAuth callback if authentication succeeds.
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  oAuthCallback(req, res) {
    const emitter = new EventEmitter();
    this.oauth.oAuthCallback(emitter, req.query.code);
    emitter.on('userdata', function(data) {
      /* !!! JUST FOR DEVELOPMENT !!! */
      data.personid += Math.floor(Math.random() * 100);
      data.token = this.jwt.generateToken(data.personid, data.username, 1);
      data.websockethostname = config.websocket.hostname;
      data.applicationServerPublicKey = config.pushNotifications.vapid.publicKey;
      data.pushId = config.pushNotifications.APN.pushId;
      data.hostname = config.pushNotifications.APN.hostname;
      return res.status(200).send(this.renderPage('public/index.tpl', data));
    }.bind(this));
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
