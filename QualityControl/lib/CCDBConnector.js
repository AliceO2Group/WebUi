const http = require('http');
const log = new (require('@aliceo2/web-ui').Log)('QualityControlCCDB');

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

    const connectionTest = this.httpGetJson('/latest');
    connectionTest.catch((err) => {
      throw new Error('Unable to connect CCDB: ' + err);
    });
  }

  /**
   * List of all objects
   * @return {Promise.<Array.<Object>, Error>}
   */
  async listObjects() {
    /**
     * Transforms objects received from CCDB to a QCG normalized one
     * with additional verification of content
     * @param {Object} item - from CCDB
     * @return {Object} to QCG use
     */
    const itemTransform = (item) => {
      if (!item.path) {
        log.warn(`CCDB returned an empty ROOT object path, ignoring`);
        return null;
      }
      if (item.path.indexOf('/') === -1) {
        log.warn(`CCDB returned an invalid ROOT object path "${item.path}", ignoring`);
        return null;
      }

      return {name: item.path};
    };

    /**
     * Filter predicate to allow only non-null values
     * @param {Any} item
     * @return {boolean}
     */
    const itemFilter = (item) => !!item;
    /**
     * Clean objects'list from CCDB and check content before giving to QCG
     * wrong paths are checked and empty items are removed
     * @param {Array.<Object>} result - from CCDB
     * @return {Array.<Object>}
     */
    const listTransform = (result) => result.objects.map(itemTransform).filter(itemFilter);
    return this.httpGetJson('/latest/.*').then(listTransform);
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
        headers: {
          Accept: 'application/json'
        }
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
}

module.exports = CCDBConnector;
