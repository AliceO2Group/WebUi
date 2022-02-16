/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const helmet = require('helmet');
const Log = require('./../log/Log.js');
const JwtToken = require('./../jwt/token.js');
const OpenId = require('./openid.js');
const path = require('path');
const url = require('url');

/**
 * HTTPS server verifies identity using OpenID Connect and provides REST API.
 * Each request is authenticated with JWT token.
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 */
class HttpServer {
  /**
   * Sets up the server, routes and binds HTTP and HTTPS sockets.
   * @param {object} httpConfig - configuration of HTTP server
   * @param {object} [jwtConfig] - configuration of JWT
   * @param {object} [connectIdConfig] - configuration of OpenID Connect
   */
  constructor(httpConfig, jwtConfig, connectIdConfig = null) {
    assert(httpConfig, 'Missing config');
    assert(httpConfig.port, 'Missing config value: port');
    httpConfig.tls = (!httpConfig.tls) ? false : httpConfig.tls;
    httpConfig.hostname = (!httpConfig.hostname) ? 'localhost' : httpConfig.hostname;
    this.limit = (!httpConfig.limit) ? '100kb' : httpConfig.limit;

    this.app = express();

    this.configureHelmet(httpConfig.hostname, httpConfig.iframeCsp);

    this.jwt = new JwtToken(jwtConfig);
    if (connectIdConfig) {
      this.openid = new OpenId(connectIdConfig);
      this.openid.createIssuer().catch(() => process.exit(1));
    }
    this.specifyRoutes();

    if (httpConfig.tls) {
      assert(httpConfig.key, 'Missing HTTP config value: key');
      assert(httpConfig.cert, 'Missing HTTP config value: cert');
      const credentials = {
        key: fs.readFileSync(httpConfig.key),
        cert: fs.readFileSync(httpConfig.cert)
      };
      this.server = https.createServer(credentials, this.app);
      this.enableHttpRedirect();
      this.port = httpConfig.portSecure;
    } else {
      this.server = http.createServer(this.app);
      this.port = httpConfig.port;
    }

    const autoListenFlag = 'autoListen';
    if (!httpConfig.hasOwnProperty(autoListenFlag) || httpConfig[autoListenFlag]) {
      this.listen();
    }

    this.log = new Log(`${process.env.npm_config_log_label ?? 'framework'}/server`);
  }

  /**
   * Starts the server listening for connections.
   * @return {Promise}
   */
  listen() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
        } else {
          this.log.info(`Server listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  /**
   * Returns the bound `address`, the address `family` name, and `port` of the
   * server as reported by the operating system if listening on an IP socket
   * (useful to find which port was assigned when getting an OS-assigned address):
   * { port: 12346, family: 'IPv4', address: '127.0.0.1' }. For a server listening
   * on a pipe or Unix domain socket, the name is returned as a string.
   * @return {(object|string)} The address of the server
   */
  address() {
    return this.server.address();
  }

  /**
   * Stops the server from accepting new connections and keeps existing connections.
   * This function is asynchronous, the server is finally closed when all connections
   * are ended and the server emits a 'close' event.
   * @return {Promise}
   */
  close() {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Configures Helmet rules to increase web app secuirty
   * @param {string} hostname whitelisted hostname for websocket connection
   * @param {list}   iframeCsp list of URLs for frame-src CSP
   * @param {number} port secure port number
   */
  configureHelmet(hostname, iframeCsp = []) {
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
        defaultSrc: ["'self'", "data:", hostname + ':*'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", 'http://' + hostname + ':*', 'https://' + hostname + ':*', 'wss://' + hostname + ':*', 'ws://' + hostname + ':*', 'wss://localhost:*', 'ws://localhost:*'],
        frameSrc: iframeCsp
        /* eslint-enable */
      }
    }));
  }

  /**
   * Specified routes and their callbacks.
   */
  specifyRoutes() {
    // Routes of authorization
    if (this.openid) {
      this.app.get('/', (req, res, next) => this.ident(req, res, next));
      this.app.get('/callback', (req, res) => this.identCallback(req, res));
    } else {
      this.app.get('/', (req, res, next) => this.addDefaultUserData(req, res, next));
    }

    // Router for static files (can grow with addStaticPath)
    // eslint-disable-next-line
    this.routerStatics = express.Router();
    this.addStaticPath(path.join(__dirname, '../../Frontend'));
    this.addStaticPath(path.join(require.resolve('mithril'), '..'), 'mithril');
    this.app.use(this.routerStatics);

    // Router for public API (can grow with get, post and delete)
    // eslint-disable-next-line
    this.routerPublic = express.Router();
    this.routerPublic.use(express.json({limit: this.limit})); // parse json body for API calls
    this.app.use('/api', this.routerPublic);

    // Router for secure API (can grow with get, post and delete)
    // eslint-disable-next-line
    this.router = express.Router();
    this.router.use((req, res, next) => this.jwtVerify(req, res, next));
    this.router.use(express.json({limit: this.limit})); // parse json body for API calls
    this.app.use('/api', this.router);

    // Catch-all if no controller handled request
    this.app.use('/api', (req, res, next) => {
      this.log.debug(`Page was not found: ${this._parseOriginalUrl(req)}`);
      res.status(404).json({
        error: '404 - Page not found',
        message: 'The requested URL was not found on this server.'
      });
    });

    this.app.use((req, res, next) => {
      this.log.debug(`Page was not found: ${this._parseOriginalUrl(req)}`);
      res.status(404).sendFile(path.join(__dirname, '../../Frontend/404.html'));
    });

    // Error handler when an API controller crashes
    this.app.use('/api', (err, req, res, next) => {
      this.log.error(`Request ${this._parseOriginalUrl(req)} failed: ${err.message || err}`);
      this.log.trace(err);

      if (process.env.NODE_ENV === 'development') {
        res.status(500).json({
          error: err,
        });
      } else {
        res.status(500).json({
          error: '500 - Server error',
          message: 'Something went wrong, please try again or contact an administrator.'
        });
      }
    });

    // Error handler when a controller crashes
    this.app.use((err, req, res, next) => {
      this.log.error(`Request ${this._parseOriginalUrl(req)} failed: ${err.message || err}`);
      this.log.trace(err);
      res.status(500).sendFile(path.join(__dirname, '../../Frontend/500.html'));
    });
  }

  /**
   * Adds default user details when skipping OAuth flow
   * @param {object} req
   * @param {object} res
   * @param {object} next - serves static paths
   * @return {object} redirection
   */
  addDefaultUserData(req, res, next) {
    const query = req.query;
    if (!query.token) {
      query.personid = 0;
      query.username = 'anonymous';
      query.name = 'Anonymous';
      query.token = this.jwt.generateToken(query.personid, query.username, query.name);
      query.access = 'admin'

      const homeUrlAuthentified = url.format({pathname: '/', query: query});
      return res.redirect(homeUrlAuthentified);
    }
    return this.ident(req, res, next);
  }

  /**
   * Serves local static file or directory under defined URI
   * @param {string} localPath - local directory to be served
   * @param {string} [uriPath] - URI path (default path is "/")
   */
  addStaticPath(localPath, uriPath) {
    if (!fs.existsSync(localPath)) {
      throw new Error(`static path ${localPath} does not exist`);
    }
    if (uriPath) {
      this.routerStatics.use(url.resolve('/', uriPath), express.static(localPath));
    } else {
      this.routerStatics.use(express.static(localPath));
    }
  }

  /**
   * Adds GET route using express router, the path will be prefix with "/api"
   * By default verifies JWT token unless public options is provided
   * @param {string} path         - path that the callback will be bound to
   * @param {function} callback   - method that handles request and response: function(req, res);
   *                                token should be passed as req.query.token;
   *                                more on req: https://expressjs.com/en/api.html#req
   *                                more on res: https://expressjs.com/en/api.html#res
   * @param {object} [options={}] - additional options
   * @param {boolean} [options.public] - true to remove token verification
   */
  get(path, ...callbacks) {
    this._all('get', path, ...callbacks);
  }

  /**
   * Adds POST route using express router, the path will be prefix with "/api"
   * By default verifies JWT token unless public options is provided
   * @param {string} path         - path that the callback will be bound to
   * @param {function} callback   - method that handles request and response: function(req, res);
   *                                token should be passed as req.query.token;
   *                                more on req: https://expressjs.com/en/api.html#req
   *                                more on res: https://expressjs.com/en/api.html#res
   * @param {object} [options={}] - additional options
   * @param {boolean} [options.public] - true to remove token verification
   */
  post(path, ...callbacks) {
    this._all('post', path, ...callbacks);
  }

  /**
   * Adds PUT route using express router, the path will be prefix with "/api"
   * By default verifies JWT token unless public options is provided
   * @param {string} path         - path that the callback will be bound to
   * @param {function} callback   - method that handles request and response: function(req, res);
   *                                token should be passed as req.query.token;
   *                                more on req: https://expressjs.com/en/api.html#req
   *                                more on res: https://expressjs.com/en/api.html#res
   * @param {object} [options={}] - additional options
   * @param {boolean} [options.public] - true to remove token verification
   */
  put(path, ...callbacks) {
    this._all('put', path, ...callbacks);
  }

  /**
   * Adds PATCH route using express router, the path will be prefix with "/api"
   * By default verifies JWT token unless public options is provided
   * @param {string} path         - path that the callback will be bound to
   * @param {function} callback   - method that handles request and response: function(req, res);
   *                                token should be passed as req.query.token;
   *                                more on req: https://expressjs.com/en/api.html#req
   *                                more on res: https://expressjs.com/en/api.html#res
   * @param {object} [options={}] - additional options
   * @param {boolean} [options.public] - true to remove token verification
   */
  patch(path, ...callbacks) {
    this._all('patch', path, ...callbacks);
  }

  /**
   * Adds DELETE route using express router, the path will be prefix with "/api"
   * By default verifies JWT token unless public options is provided
   * @param {string} path         - path that the callback will be bound to
   * @param {function} callback   - method that handles request and response: function(req, res);
   *                                token should be passed as req.query.token;
   *                                more on req: https://expressjs.com/en/api.html#req
   *                                more on res: https://expressjs.com/en/api.html#res
   * @param {object} [options={}] - additional options
   * @param {boolean} [options.public] - true to remove token verification
   */
  delete(path, ...callbacks) {
    this._all('delete', path, ...callbacks);
  }

  /**
   * Adds an route to the express router, the path will be prefix with "/api"
   * By default verifies JWT token unless public options is provided
   * @param {string} method       - http method to use
   * @param {string} path         - path that the callback will be bound to
   * @param {function[]} callback - method or array of methods that handles request
   *                                and response: function(req, res); token should
   *                                be passed as req.query.token;
   *                                more on req: https://expressjs.com/en/api.html#req
   *                                more on res: https://expressjs.com/en/api.html#res
   * @param {object} [options={}] - additional options
   * @param {boolean} [options.public] - true to remove token verification
   */
  _all(method, path, ...callbacks) {
    let options = {};
    if (typeof callbacks.slice(-1).pop() !== 'function') {
      options = callbacks.pop();
    }

    if (options.public) {
      this.routerPublic[method](path, ...callbacks);
      return;
    }

    this.router[method](path, ...callbacks);
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
   * Handles authentication flow (default path of the app: '/')
   * - If JWT query.token is valid it grants the access to the application
   * - Redirects to the OpenID flow otherwise, and sets the current state of URL
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   * @param {object} next - serves static paths when OpenId succeeds
   * @return {object} redirects to OpenID  flow or displays the page if JWT token is valid
   */
  ident(req, res, next) {
    const query = req.query; // User's arguments
    const token = req.query.token;

    if (token) {
      this.jwt.verify(req.query.token).then(() => next(), (error) => {
        this.log.debug(`${error.name} : ${error.message}`);
        res.status(403).json({message: error.name});
      });
    } else {
      // Redirects to the OpenID flow
      const state = Buffer.from(JSON.stringify(query)).toString('base64');
      return res.redirect(this.openid.getAuthUrl(state));
    }
  }

  /**
   * OpenID Connect callback - when successfully authorized (/callback)
   * Redirects to the application deserializes the query parameters from state variable
   * and injects them to the url
   * @param {object} req - HTTP request
   * @param {object} res - HTTP response
   */
  identCallback(req, res) {
    this.openid.callback(req).then((tokenSet) => {
      const details = tokenSet.claims();

      // Set token and user details in the query
      const query = {
        personid: details.cern_person_id,
        name: details.name,
        username: details.cern_upn,
        access: this.authorise(details),
        token: this.jwt.generateToken(details.cern_person_id, details.cern_upn, details.name, this.authorise(details)),
      };

      // Read back user params from state
      const userQuery = JSON.parse(Buffer.from(req.query.state, 'base64').toString('ascii'));

      // Concatenates with user query
      Object.assign(query, userQuery);

      res.redirect(url.format({pathname: '/', query: query}));
    }).catch((reason) => {
      this.log.info('OpenId failed: ' + reason);
      res.status(401).send('OpenId failed');
    });
  }

  /**
   * Provides access level number for JWT token depending on users' role
   * @param {object} details - user details
   * @return {string} - comma separated access roles
   */
  authorise(details) {
    let scope = [];
    if (details.hasOwnProperty('resource_access')) {
      scope = details.resource_access[Object.keys(details.resource_access)[0]].roles;
    }
    return scope.join(',');
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
        req.session = {
          personid: parseInt(data.id),
          username: data.username,
          name: data.name,
          access: data.access
        };
        next();
      }, ({name, message}) => {
        this.log.debug(`${name} : ${message}`);

        const response = {error: '403 - Json Web Token Error'};

        // Allow for a custom message for known error messages
        switch (message) {
          case 'jwt must be provided':
            response.message = 'You must provide a JWT token';
            break;
          default:
            response.message = 'Invalid JWT token provided';
            break;
        }

        res.status(403).json(response);
      });
  }

  /**
   * Given a Request object, returns a new one
   * with the query parameter, token, removed
   * @param {Request} req
   */
  _parseOriginalUrl(req) {
    try {
      return req.originalUrl.replace(`token=${req.query.token}`, '');
    } catch (error) {
      return req.originalUrl
    }
  }
}
module.exports = HttpServer;
