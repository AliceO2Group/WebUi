const http = require('http');
const log = new (require('@aliceo2/web-ui').Log)('QCG-CCDBConnector');

/**
 * Gateway for all CCDB calls
 */
class CCDBConnector {
  /**
   * Setup and test CCDB connection
   * @param {Object} config - {hostname, port}
   */
  constructor(config) {
    if (!config) {
      throw new Error('Empty CCDB config');
    }
    if (!config.hostname) {
      throw new Error('Empty hostname in CCDB config');
    }
    if (!config.port) {
      throw new Error('Empty port in CCDB config');
    }

    this.hostname = config.hostname;
    this.port = config.port;
    this.prefix = this.getPrefix(config);
    this.headers = {
      Accept: 'application/json',
      'X-Filter-Fields': 'path,createTime,lastModified',
    };
  }

  /**
   * Test connection to CCDB
   * @return {Promise.<Array.<String>, Error>}
   */
  async testConnection() {
    return this.httpGetJson(`/browse/${this.prefix}`)
      .then(() => log.info('Successfully connected to CCDB'))
      .catch((err) => {
        log.error('Unable to connect to CCDB');
        log.trace(err);
        throw new Error(`Unable to connect to CCDB due to: ${err}`);
      });
  }

  /**
   * List of all objects
   * @return {Promise.<Array.<Object>, Error>}
   */
  async listObjects() {
    return this.httpGetJson(`/latest/${this.prefix}.*`)
      .then((result) =>
        result.objects
          .map(this.itemTransform)
          .filter((item) => !!item)
      );
  }

  /**
   * Util to get JSON data (parsed) from CCDB server
   * @param {string} path - path en CCDB server
   * @return {Promise.<Object, Error>} JSON response
   */
  httpGetJson(path) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.hostname,
        port: this.port,
        path: path,
        method: 'GET',
        headers: this.headers
      };

      /**
       * Generic handler for client http requests,
       * buffers response, checks status code and parses JSON
       * @param {Response} response
       */
      const requestHandler = (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Non-2xx status code: ' + response.statusCode));
          return;
        }

        const bodyChunks = [];
        response.on('data', (chunk) => bodyChunks.push(chunk));
        response.on('end', () => {
          try {
            const body = JSON.parse(bodyChunks.join(''));
            resolve(body);
          } catch (e) {
            reject(new Error('Unable to parse JSON'));
          }
        });
      };

      const request = http.request(requestOptions, requestHandler);
      request.on('error', (err) => reject(err));
      request.end();
    });
  }

  /*
   * Helpers
   */

  /**
   * Transforms objects received from CCDB to a QCG normalized one
   * with additional verification of content
   * @param {Object} item - from CCDB
   * @return {Object} to QCG use
   */
  itemTransform(item) {
    if (!item.path) {
      log.warn(`CCDB returned an empty ROOT object path, ignoring`);
      return null;
    }
    if (item.path.indexOf('/') === -1) {
      log.warn(`CCDB returned an invalid ROOT object path "${item.path}", ignoring`);
      return null;
    }
    return {name: item.path, createTime: parseInt(item.createTime), lastModified: parseInt(item.lastModified)};
  }

  /**
   * Get prefix from configuration file and parse it
   * or use as default empty prefix
   * @param {JSON} config
   * @return {string} - format `name`
   */
  getPrefix(config) {
    let prefix = '';
    if (config.prefix && config.prefix.trim() !== '') {
      prefix = config.prefix.substr(0, 1) === '/' ? config.prefix.substr(1, config.prefix.length) : config.prefix;
      prefix = prefix.substr(prefix.length - 1, 1) === '/' ? prefix.substr(0, prefix.length - 1) : prefix;
    }
    return prefix;
  }
}

module.exports = CCDBConnector;
