const log = new (require('@aliceo2/web-ui').Log)('ConsulConnector');

/**
 * Gateway for all Consul Consumer calls
 */
class ConsulConnector {
  /**
   * Setup ConsulConnector
   * @param {ConsulService} consulService
   * @param {string} flpHardwarePath
   */
  constructor(consulService, flpHardwarePath) {
    this.consulService = consulService;
    this.flpHardwarePath = flpHardwarePath ? flpHardwarePath : 'o2/hardware/flps';
  }


  /**
   * Method to check if consul service can be used
   */
  async testConsulStatus() {
    if (this.consulService) {
      this.consulService.getConsulLeaderStatus()
        .then((data) => log.info(`Consul service is up and running on: ${data}`))
        .catch((error) => log.error(`Could not contact Consul Service due to ${error}`));
    } else {
      log.error('Unable to retrieve configuration of consul service');
    }
  }

  /**
  * Method to request all CRUs available in consul KV store
  * @param {Request} req
  * @param {Response} res
  */
  async getCRUs(req, res) {
    res.status(404);
    res.send({message: 'Could not find any Readout Cards by key some/path'});
    if (this.consulService) {
      const regex = new RegExp(`.*/.*/cards`);
      this.consulService.getOnlyRawValuesByKeyPrefix(this.flpHardwarePath)
        .then((data) => {
          const crusByHost = {};
          Object.keys(data)
            .filter((key) => key.match(regex))
            .forEach((key) => {
              const splitKey = key.split('/');
              const hostKey = splitKey[splitKey.length - 2];
              crusByHost[hostKey] = JSON.parse(data[key]);
            });

          res.status(200);
          res.json(crusByHost);
        }).catch((error) => {
          log.error(`Message from source: ${error}`);
          res.status(404);
          res.send({message: 'Could not find any Readout Cards by key some/path'});
          // if (error.message.includes('404')) {
          //   log.info('Messages includes 404');
          //   log.trace(error);
          //   log.error(`Could not find any Readout Cards by key ${this.flpHardwarePath}`);
          //   this.errorHandler(`Could not find any Readout Cards by key ${this.flpHardwarePath}`, res, 404);
          // } else {
          //   this.errorHandler(error, res, 502);
          // }
        });
    } else {
      this.errorHandler('Unable to retrieve configuration of consul service', res, 502);
    }
  }

  /**
   * Handle error cases
   * @param {string|JSON} err
   * @param {Response} res
   * @param {number} status
   */
  errorHandler(err, res, status = 500) {
    if (status > 500) {
      if (err.stack) {
        log.trace(err);
      }
      log.error(err.message || err);
    }
    res.status(status);
    const t = {message: err.message || err};
    log.info('T IS');
    log.info(t);
    res.send(t);
  }


  /**
   * Method to query consul for keys by a prefix and parse results into a list of FLP names
   * @param {Request} req
   * @param {Response} res - list of strings representing flp names
   */
  async getFLPs(req, res) {
    if (this.consulService) {
      this.consulService.getKeysByPrefix(this.flpHardwarePath)
        .then((data) => {
          const regex = new RegExp('.*o2/hardware/flps/.*/.*');
          const flpList = data.filter((key) => key.match(regex))
            .map((key) => key.split('/')[3]);
          res.status(200);
          res.json(flpList);
        })
        .catch((error) => {
          if (error.message.includes('404')) {
            log.trace(error);
            log.error(`Could not find any FLPs by key ${this.flpHardwarePath}`);
            this.errorHandler(`Could not find any FLPs by key ${this.flpHardwarePath}`, res, 404);
          } else {
            this.errorHandler(error, res, 502);
          }
        });
    } else {
      this.errorHandler('Unable to retrieve configuration of consul service', res, 502);
    }
  }
}

module.exports = ConsulConnector;
