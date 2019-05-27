const http = require('http');

/**
 * Gateway for all Consul Calls
 */
class ConsulConnector {
  /**
   * Setup Consul Configuration
   * @param {Object} config - {hostname, port}
   */
  constructor(config) {
    if (!config) {
      throw new Error('Empty Consul config');
    }
    if (!config.hostname) {
      throw new Error('Empty hostname in Consul config');
    }
    if (!config.port) {
      throw new Error('Empty port in Consul config');
    }
    this.hostname = config.hostname;
    this.port = config.port;
  }

  /**
   * Method to test Consul agent leader is working
   */
  async isConsulUpAndRunning() {
    const connection = this.httpGetJson('/v1/status/leader');
    connection.catch((err) => {
      throw new Error('Unable to connect to Consul: ' + err);
    });
  }

  /**
   * Method to return a promise containing the names of the objects in online mode
   * Format:
   * [
   *  {name: parentName/childName}
   * ]
   * @return {Promise.<Array.<Object>, Error>}
   */
  async listOnlineObjects() {
    return this.httpGetJson('/v1/agent/services').then((services) => this.getTagsFromServices(services));
  }

  /**
   * Util to get JSON data (parsed) from Consul server
   * @param {string} path - path en Consul server
   * @return {Promise.<Object, Error>} JSON response
   */
  async httpGetJson(path) {
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

  /**
   * Method to extract the tags from a service list. This represents objects that are in online mode.
   * @param {*} services
   * @return {Array<JSON>} [{ name: tag1 }, { name: tag2 }]
   */
  getTagsFromServices(services) {
    const tags = [];
    for (const serviceName in services) {
      if (services[serviceName] && services[serviceName].Tags && services[serviceName].Tags.length > 0) {
        const tagsToBeAdded = services[serviceName].Tags;
        tagsToBeAdded.forEach((tag) => tags.push({name: tag}));
      }
    }
    return tags;
  }
}

module.exports = ConsulConnector;
