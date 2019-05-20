const http = require('http');
const log = new (require('@aliceo2/web-ui').Log)('ConsulConnector');

/**
 * Gateway for all Consul Calls
 */
class ConsulConnector {
  /**
   * Setup and test Consul connection
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
   * 
   */
  async checkStatus() {
    // const prom = await this.httpGetJson('/v1/status/leader').then(console.log("test"));
    // console.log(prom);
    // const connectionTest = this.httpGetJson('/v1/status/leader');
    // connectionTest.catch((err) => {
    //   throw new Error('Unable to check status of Consul\'s leader agent: ' + err);
    // });
    return true;
  }

  /**
   * @return {Promise.<Array.<Object>, Error>}
   */
  async listOnlineObjects() {
    return ['test', 'test2'];
  }
}

module.exports = ConsulConnector;
