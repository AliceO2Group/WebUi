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

const log = new (require('@aliceo2/web-ui').Log)('ConsulConnector');
const errorHandler = require('./utils.js').errorHandler;

/**
 * Gateway for all Consul Consumer calls
 */
class ConsulConnector {
  /**
   * Setup ConsulConnector
   * @param {ConsulService} consulService
   * @param {JSON} config
   */
  constructor(consulService, config) {
    this.consulService = consulService;
    this.config = config;
    this.flpHardwarePath = (config && config.flpHardwarePath) ? config.flpHardwarePath : 'o2/hardware/flps';
    this.readoutPath = (config && config.readoutPath) ? config.readoutPath : 'o2/components/readout';
    this.qcPath = (config && config.qcPath) ? config.qcPath : 'o2/components/qc';
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
    if (this.consulService) {
      const regex = new RegExp(`.*/.*/cards`);
      this.consulService.getOnlyRawValuesByKeyPrefix(this.flpHardwarePath).then((data) => {
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
        if (error.message.includes('404')) {
          log.trace(error);
          log.error(`Could not find any Readout Cards by key ${this.flpHardwarePath}`);
          errorHandler(`Could not find any Readout Cards by key ${this.flpHardwarePath}`, res, 404);
        } else {
          errorHandler(error, res, 502);
        }
      });
    } else {
      errorHandler('Unable to retrieve configuration of consul service', res, 502);
    }
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
          res.json({
            consulQcPrefix: this.consulQcPrefix,
            consulReadoutPrefix: this.consulReadoutPrefix,
            flps: [...new Set(flpList)]
          });
        })
        .catch((error) => {
          if (error.message.includes('404')) {
            log.trace(error);
            log.error(`Could not find any FLPs by key ${this.flpHardwarePath}`);
            errorHandler(`Could not find any FLPs by key ${this.flpHardwarePath}`, res, 404);
          } else {
            errorHandler(error, res, 502);
          }
        });
    } else {
      errorHandler('Unable to retrieve configuration of consul service', res, 502);
    }
  }

  /**
   * Build and return the URL prefix for
   * Readout Configuration Consul Path
   * @return {string}
   */
  get consulReadoutPrefix() {
    if (!this.config.hostname || !this.config.port) {
      return '';
    }
    return `${this.config.hostname}:${this.config.port}/${this.readoutPath}/`
  }

  /**
   * Build and return the URL prefix for
   * QC Configuration Consul Path
   */
  get consulQcPrefix() {
    if (!this.config.hostname || !this.config.port) {
      return '';
    }
    return `${this.config.hostname}:${this.config.port}/${this.qcPath}/`
  }
}

module.exports = ConsulConnector;
