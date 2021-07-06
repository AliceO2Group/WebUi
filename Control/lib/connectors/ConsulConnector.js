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

const log = new (require('@aliceo2/web-ui').Log)('Control');
const errorHandler = require('./../utils.js').errorHandler;

/**
 * Gateway for all Consul Consumer calls
 */
class ConsulConnector {
  /**
   * Setup ConsulConnector
   * @param {ConsulService} consulService
   * @param {JSON} config
   */
  constructor(consulService, config, padLock = undefined) {
    this.consulService = consulService;
    this.config = config;
    this.flpHardwarePath = (config && config.flpHardwarePath) ? config.flpHardwarePath : 'o2/hardware/flps';
    this.readoutCardPath = (config && config.readoutCardPath) ? config.readoutCardPath : 'o2/components/readoutcard';
    this.qcPath = (config && config.qcPath) ? config.qcPath : 'o2/components/qc';
    this.readoutPath = (config && config.readoutPath) ? config.readoutPath : 'o2/components/readout';
    this.consulKVPrefix = (config && config.consulKVPrefix) ? config.consulKVPrefix : 'ui/alice-o2-cluster/kv';

    this.padLock = padLock;
  }

  /**
   * Method to check if consul service can be used
   */
  async testConsulStatus() {
    if (this.consulService) {
      this.consulService.getConsulLeaderStatus()
        .then((data) => log.info(`[Consul] Service is up and running on: ${data}`))
        .catch((error) => log.error(`[Consul] Connection failed due to ${error}`));
    } else {
      log.error('[Consul] Unable to retrieve configuration');
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
          log.error(`[Consul] Could not find any Readout Cards by key ${this.flpHardwarePath}`);
          errorHandler(`[Consul] Could not find any Readout Cards by key ${this.flpHardwarePath}`, res, 404);
        } else {
          errorHandler(error, res, 502);
        }
      });
    } else {
      errorHandler('[Consul] Unable to retrieve configuration of consul service', res, 502);
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
            log.error(`[Consul] Could not find any FLPs by key ${this.flpHardwarePath}`);
            errorHandler(`[Consul] Could not find any FLPs by key ${this.flpHardwarePath}`, res, 404);
          } else {
            errorHandler(error, res, 502);
          }
        });
    } else {
      errorHandler('[Consul] Unable to retrieve configuration of consul service', res, 502);
    }
  }

  /**
   * Get a list of FLPs loaded from Consul
   * @return {Array<String>}
   */
  async getFLPsList() {
    if (this.consulService) {
      try {
        const data = await this.consulService.getKeysByPrefix(this.flpHardwarePath);
        const regex = new RegExp('.*o2/hardware/flps/.*/.*');
        const flpList = data.filter((key) => key.match(regex))
          .map((key) => key.split('/')[3]);
        return [...new Set(flpList)];
      } catch (error) {
        if (error.message.includes('404')) {
          log.trace(error);
          log.error(`[Consul] Could not find any FLPs by key ${this.flpHardwarePath}`);
          throw new Error(`Could not find any FLPs by key ${this.flpHardwarePath}`);
        }
      }
    } else {
      throw new Error('There was no ConsulService provided');
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
        if (error.toString().includes('404')) {
          const missingKVErrorMessage = 'No value found for one of the keys:\n' +
            `${this.flpHardwarePath}\nor\n${this.readoutCardPath}`;
          errorHandler(missingKVErrorMessage, res, 404);
        } else {
          errorHandler(error, res, 502);
        }
      }
    } else {
      errorHandler('Unable to retrieve configuration of the CRUs', res, 502);
    }
  }

  /**
   * Request the latest configuration from consul and within the latest configuration
   * update the following fields with the data from the client:
   * * userLogicEnabled
   * * link0 - link11
   * @param {Request} req
   * @param {Response} res
   */
  async saveCRUsConfiguration(req, res) {
    if (this.padLock?.lockedBy === null || this.padLock?.lockedBy === undefined) {
      errorHandler('Control is not locked', res, 403);
      return false;
    } else if (req.session.personid != this.padLock.lockedBy) {
      errorHandler(`Control is locked by ${this.padLock.lockedByName}`, res, 403);
      return false;
    } else {
      // Get the latest version of the configuraiton
      const latestCardsByHost = await this._getCardsByHost();
      const latestCrusByHost = this._mapCrusWithId(latestCardsByHost);
      const latestCrusWithConfigByHost = await this._getCrusConfigById(latestCrusByHost);

      const crusByHost = req.body;
      const keyValues = this._mapToKVPairs(crusByHost, latestCrusWithConfigByHost);
      try {
        await this.consulService.putListOfKeyValues(keyValues);
        log.info('[Consul] Successfully saved configuration links');
        res.status(200).json({info: {message: 'CRUs Configuration saved'}});
      } catch (error) {
        errorHandler(error, res, 502);
      }
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
    const crusByEndpoint = await this.consulService.getOnlyRawValuesByKeyPrefix(this.readoutCardPath);
    Object.keys(crusByEndpoint)
      .filter((fieldKey) => fieldKey.split('/').length >= 7) // filter out incomplete keys
      .filter((fieldKey) => fieldKey.split('/')[4].toUpperCase() === 'CRU') // keep only CRU cards
      .forEach((fieldKey) => {
        // o2/components/readoutcard/<hostname>/cru/<serial>/<endpoint>
        const splitKey = fieldKey.split('/');
        const host = splitKey[3];
        const cardType = splitKey[4];
        const serial = splitKey[5];
        const endpoint = splitKey[6];
        const cruId = `${cardType}_${serial}_${endpoint}`;
        if (crus[host] && crus[host][cruId]) {
          crus[host][cruId].config = JSON.parse(crusByEndpoint[fieldKey]);
        }
      });
    return crus;
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
  }

  /**
   * Given the client side configuration and the latest saved configuration in Consul,
   * update the latest configuration with the data from the client side on the following fields:
   * * cru.userLogicEnabled
   * * link0 - link11
   * @param {JSON} crusByHost
   * @return {Array<KV>}
   */
  _mapToKVPairs(crusByHost, latestCrusByHost) {
    const kvPairs = [];
    Object.keys(crusByHost).forEach((host) => {
      Object.keys(crusByHost[host]).forEach((cruId) => {
        const latestConfig = latestCrusByHost[host][cruId].config;
        const cruConfig = crusByHost[host][cruId].config;

        if (cruConfig.cru && cruConfig.cru.userLogicEnabled) {
          latestConfig.cru.userLogicEnabled = cruConfig.cru.userLogicEnabled;
        }
        Object.keys(latestConfig)
          .filter((key) => key.match('link[0-9]{1,2}')) // select only fields from links0 to links11
          .forEach((key) => {
            if (cruConfig[key] && cruConfig[key].enabled) {
              latestConfig[key].enabled = cruConfig[key].enabled
            }
          });
        const serial = cruId.split('_')[1];
        const endpoint = cruId.split('_')[2];
        const pair = {}
        pair[`${this.readoutCardPath}/${host}/cru/${serial}/${endpoint}`] = JSON.stringify(latestConfig, null, 2);
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
   * Build and return the URL prefix for Readout Consul KV Store  
   * @return {string}
   */
  get consulKvStoreReadout() {
    if (!this.config.hostname || !this.config.port) {
      return '';
    }
    return `${this.config.hostname}:${this.config.port}/${this.consulKVPrefix}/${this.readoutPath}`
  }

  /**
   * Build and return the URL prefix for QC Consul KV Store  
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
