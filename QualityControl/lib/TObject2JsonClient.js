const tobject2json = require('../tobject2json.node');

/**
 * Connect to a TObject2Json server and send requests though TCP/IP
 * and receive responses asynchronously (multiplexing).
 */
class TObject2JsonClient {
  /**
   * Connects to remote TObject2Json server and listen to it
   * @param {string} connector - Connecter type: ccdb/mysql
   * @param {Object} config - {host, port}
   */
  constructor(connector, config) {
    if (connector == 'ccdb') {
      connector = 'CCDB';
    }
    if (connector == 'mysql') {
      connector = 'MySQL';
    }
    tobject2json.init(connector, config.hostname + ':' + config.port, '', '', '');
  }

  /**
   * Get JSON-encoded ROOT object using QualityControl/TObject2Json C++ module
   * @param {string} path - object's path (agentName/objectName)
   * @return {Promise.<Object|null, string>} The root data, null is not found
   */
  retrieve(path) {
    if (!path || path.indexOf('/') === -1) {
      return Promise.reject('Path should contain a slash at least');
    }

    return new Promise((resolve, fail) => {
      tobject2json.get(path, (error, result) => {
        if (error) {
          fail('TObject2Json C++ module failed');
        } else {
          let message;
          try {
            message = JSON.parse(result);
          } catch (e) {
            fail('JSON decoding failed');
          }
          resolve(message);
        }
      });
    });
  }
}

module.exports = TObject2JsonClient;
