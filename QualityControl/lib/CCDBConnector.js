const http = require('http');
const {log} = require('@aliceo2/web-ui');

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
    const itemFilter = (item) => !!item;
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
          'Accept': 'application/json'
        }
      };

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
