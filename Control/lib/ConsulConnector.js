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
    this.readoutCardPath = (config && config.readoutCardPath) ? config.readoutCardPath : 'o2/components/readoutcard';
    this.qcPath = (config && config.qcPath) ? config.qcPath : 'o2/components/qc';
    this.readoutPath = (config && config.readoutPath) ? config.readoutPath : 'o2/components/readout';
    this.consulKVPrefix = (config && config.consulKVPrefix) ? config.consulKVPrefix : 'ui/alice-o2-cluster/kv';
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
  * Method to request all CRUs available in consul KV store under the 
  * hardware key
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
            consulKvStore: this.consulKvStore,
            consulKvStoreQC: this.consulKvStoreQC,
            consulKvStoreReadout: this.consulKvStoreReadout,
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
   * Get CRUs stored under the hardware path with their information
   * and configuration
   * @param {Request} req
   * @param {Response} res
   */
  async getCRUsWithConfiguration(req, res) {
    if (this.consulService) {
      try {
        let cardsByHost = await this._getCardsByHost();
        const crusByHost = this._mapCrusWithId(cardsByHost);
        const crusWithConfigByHost = await this._getCrusConfigById(crusByHost);
        res.status(200).json(crusWithConfigByHost);
      } catch (error) {
        errorHandler(error, res, 502);
      }
    } else {
      errorHandler('Unable to retrieve configuration of the CRUs', res, 502);
    }
  }

  /**
   * Save the given CRUs configuration to Consul
   * @param {Request} req
   * @param {Response} res
   */
  async saveCRUsConfiguration(req, res) {
    const crusByHost = req.body;
    const keyValues = this._mapToKVPairs(crusByHost);
    try {
      await this.consulService.putListOfKeyValues(keyValues);
      log.info('Successfully saved configuration links');
      res.status(200).json({message: 'CRUs Configuration saved'});
    } catch (error) {
      errorHandler(error, res, 502);
    }
  }

  /**
   * Query Consul for configuration of the CRUs based
   * on the readoutPath prefix and group them in a JSON
   * by host and cruid (cru_<serial>_<endpoint>)
   * @param {JSON} crus
   * @return {Promise.<JSON, Error>}
   */
  async _getCrusConfigById(crus) {
    try {
      const crusByEndpoint = await this.consulService.getOnlyRawValuesByKeyPrefix(this.readoutCardPath);
      Object.keys(crusByEndpoint)
        .filter((fieldKey) => fieldKey.split('/').length >= 7) // filter out incomplete keys
        .forEach((fieldKey) => {
          // o2/components/readoutcard/<hostname>/cru/<serial>/<endpoint>
          const splitKey = fieldKey.split('/');
          const host = splitKey[3];
          const cardType = splitKey[4];
          const serial = splitKey[5];
          const endpoint = splitKey[6];
          const cruId = `${cardType}_${serial}_${endpoint}`;

          crus[host][cruId].config = JSON.parse(crusByEndpoint[fieldKey]);
        });
      return crus;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a JSON of cards grouped by their host by querying Consul through the flpHardwarePath
   * e.g
   * { 
   *  host_one: {
   *    0: {
   *      key: value
   *    },
   *    1: {
   *      key: value
   *    }
   *  }
   * }
   * @return {Promise.<JSON, Error>}
   */
  async _getCardsByHost() {
    const regex = new RegExp(`.*cards`);
    try {
      const data = await this.consulService.getOnlyRawValuesByKeyPrefix(this.flpHardwarePath);
      const cardsByHost = {};
      Object.keys(data)
        .filter((flpKey) => flpKey.match(regex))
        .forEach((flpKey) => {
          const splitFlpKey = flpKey.split('/');
          const hostName = splitFlpKey[splitFlpKey.length - 2];
          cardsByHost[hostName] = JSON.parse(data[flpKey]);
        });
      return cardsByHost;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method to build the keys for Consul update
   * @param {JSON} crusByHost
   * @return {Array<KV>}
   */
  _mapToKVPairs(crusByHost) {
    const kvPairs = [];
    Object.keys(crusByHost).forEach((host) => {
      Object.keys(crusByHost[host]).forEach((cruId) => {
        const cruConfig = crusByHost[host][cruId].config;
        const serial = cruId.split('_')[1];
        const endpoint = cruId.split('_')[2];
        const pair = {}
        pair[`${this.readoutCardPath}/${host}/cru/${serial}/${endpoint}`] = JSON.stringify(cruConfig, null, 2);
        kvPairs.push(pair);
      })
    });
    return kvPairs;
  }

  /**
   * Filter out CRORC cards and replace the incremental
   * index on each CRU by their unique ID used in CRUs configuration
   * @param {JSON} cards
   * @return {JSON}
   */
  _mapCrusWithId(cards) {
    const crusWithIdByHost = {}
    Object.keys(cards).forEach((hostName) => {
      const hostCru = {};
      Object.keys(cards[hostName])
        .filter((cardIndex) => cards[hostName][cardIndex].type.toUpperCase() === 'CRU')
        .sort((a, b) => this._sortCRUsBySerialEndpoint(cards[hostName][a], cards[hostName][b]))
        .forEach((cruIndex) => {
          const cruInfo = cards[hostName][cruIndex];
          hostCru[`cru_${cruInfo.serial}_${cruInfo.endpoint}`] = {info: cruInfo, config: {}};
          crusWithIdByHost[hostName] = hostCru;
        });
    });
    return crusWithIdByHost;
  }

  /**
   * Compare two CRUs based on their id (cru_<serial>_<endpoint>)
   * from the give CRU JSON object
   * @param {JSON} cards
   * @param {number} a
   * @param {number} b
   * @return {number} 1 / -1
   */
  _sortCRUsBySerialEndpoint(cruA, cruB) {
    const cruIdA = `cru_${cruA.serial}_${cruA.endpoint}`;
    const cruIdB = `cru_${cruB.serial}_${cruB.endpoint}`;
    return cruIdA > cruIdB ? 1 : -1;
  }

  /**
   * Helpers
   */

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
   * @return {string}
   */
  get consulQcPrefix() {
    if (!this.config.hostname || !this.config.port) {
      return '';
    }
    return `${this.config.hostname}:${this.config.port}/${this.qcPath}/`
  }

  /**
   * Build and return the URL prefix for
   * Consul KV Store  
   * @return {string}
   */
  get consulKvStoreReadout() {
    if (!this.config.hostname || !this.config.port) {
      return '';
    }
    return `${this.config.hostname}:${this.config.port}/${this.consulKVPrefix}/${this.readoutPath}`
  }

  /**
   * Build and return the URL prefix for
   * Consul KV Store  
   * @return {string}
   */
  get consulKvStoreQC() {
    if (!this.config.hostname || !this.config.port) {
      return '';
    }
    return `${this.config.hostname}:${this.config.port}/${this.consulKVPrefix}/${this.qcPath}`
  }
}

module.exports = ConsulConnector;
