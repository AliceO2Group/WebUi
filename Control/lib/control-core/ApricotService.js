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

const assert = require('assert');
const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'cog'}/apricotservice`);
const {errorHandler, errorLogger} = require('./../utils.js');
const CoreEnvConfig = require('../dtos/CoreEnvConfig.js');
const User = require('./../dtos/User.js');
const CoreUtils = require('./CoreUtils.js');
const COMPONENT = 'COG-v1';
const {APRICOT_COMMANDS: {ListRuntimeEntries, GetRuntimeEntry}} = require('./ApricotCommands.js');

/**
 * Gateway for all Apricot - Core calls
 */
class ApricotService {
  /**
   * Constructor initializing dependencies
   * @param {GrpcProxy} apricotProxy
   */
  constructor(apricotProxy) {
    assert(apricotProxy, 'Missing GrpcProxy dependency for Apricot');
    this.apricotProxy = apricotProxy;

    this.detectors = [];
    this.hostsByDetector = new Map();
    this.init();
  }

  /**
   * Initialize service with static data from AliECS
   */
  async init() {
    try {
      this.detectors = (await this.apricotProxy['ListDetectors']()).detectors;
      await Promise.allSettled(
        this.detectors.map(async (detector) => {
          try {
            const {hosts} = await this.apricotProxy['GetHostInventory']({detector});
            this.hostsByDetector.set(detector, hosts);
          } catch (error) {
            log.error(`Unable to retrieve list of hosts for detector: ${detector}`);
          }
        })
      );
    } catch (error) {
      log.error('Unable to list detectors');
    }
  }

  /**
   * Use Apricot defined `o2apricot.proto` `GetRuntimeEntry` to retrieve the value stored in a specified key
   * @param {String} component - component for which it should query
   * @returns {Promise<String>} - value stored by apricot
   */
  async getRuntimeEntryByComponent(component) {
    try {
      const {payload = '{}'} = await this.apricotProxy[GetRuntimeEntry]({component});
      return payload;
    } catch (error) {
      const {code, details = ''} = error;
      if (code === 2 && details.includes('nil')) {
        error.code = 5;
      }
      throw error;
    }
  }

  /**
   * Retrieve an in-memory detectors list
   * If list does not exist, make a request to Apricot
   * @param {Request} req
   * @param {Response} res
   */
  async getDetectorList(_, res) {
    if (this.detectors.length === 0) {
      try {
        log.info('AliECS GUI => ListDetectors')
        this.detectors = (await this.apricotProxy['ListDetectors']()).detectors;
      } catch (error) {
        errorHandler(error, res, 503, 'apricotservice');
        return;
      }
    }
    res.status(200).json({detectors: this.detectors});
  }

  /**
   * Return an in-memory map of hosts grouped by their detector
   * If map is empty, make a request to Apricot
   * @param {Request} req
   * @param {Response} res
   */
  async getHostsByDetectorList(_, res) {
    if (this.hostsByDetector.size === 0) {
      try {
        log.info('AliECS GUI => ListDetectors');
        this.detectors = (await this.apricotProxy['ListDetectors']()).detectors;

        await Promise.allSettled(
          this.detectors.map(async (detector) => {
            try {
              log.info(`AliECS GUI => GetHostInventory for detector: ${detector}`);
              const {hosts} = await this.apricotProxy['GetHostInventory']({detector});
              this.hostsByDetector.set(detector, hosts);
            } catch (error) {
              log.error(`Unable to retrieve list of hosts for detector: ${detector}`);
              log.error(error);
            }
          })
        );
      } catch (error) {
        errorHandler(error, res, 503, 'apricotservice');
        return;
      }
    }
    res.status(200).json({hosts: Object.fromEntries(this.hostsByDetector)});
  }

  /**
   * Request a list of detectors from Apricot to confirm 
   * connection and O2Apricot are up
   * @return {Promise}
   */
  async getStatus() {
    try {
      if (this.apricotProxy?.isConnectionReady) {
        await this.apricotProxy['ListDetectors']();
      } else {
        throw new Error('Unable to check status of Apricot')
      }
    } catch (error) {
      log.error(error);
      throw error;
    }
  }

  /**
   * Method to execute command contained by req.path and send back results
   * @param {Request} req
   * @param {Response} res
   */
  executeCommand(req, res) {
    const method = CoreUtils.parseMethodNameString(req.path);
    if (this.apricotProxy?.isConnectionReady && method) {
      if (!method.startsWith('Get')) {
        const type = req.body.type ? ` (${req.body.type})` : '';
        log.info(`${req.session.personid} => ${method} ${type}`, 6);
      }
      this.apricotProxy[method](req.body)
        .then((response) => res.json(response))
        .catch((error) => errorHandler(error, res, 504, 'apricotservice'));
    } else {
      const error = this.apricotProxy?.connectionError?.message
        ?? 'Could not establish connection to O2Apricot due to potentially undefined method';
      errorHandler(error, res, 503, 'apricotservice');
    }
  }

  /**
   * Responds to request to save a configuration for creating a new environment;
   * * Parses data to be saved including user data;
   * * If name of the configuration already exists throws an error to inform user to load and update rather than direct save;
   * * If name is new, the environment will be saved via Apricot
   * @param {Request} req - HTTP Object with data on the configuration to be saved/updated
   * @param {Response} res - HTTP Object used to send a response back to the client with the status of its action
   * @returns {void}
   */
  async saveCoreEnvConfig(req, res) {
    try {
      const data = req.body;
      data.user = new User(req.session);
      const envConf = CoreEnvConfig.fromJSON(data);

      const {payload: configurations} = await this.apricotProxy[ListRuntimeEntries]({component: COMPONENT});
      if (configurations.includes(envConf.id)) {
        errorHandler(`A configuration with name '${envConf.id}' already exists. `
          + 'Please load existing configuration and use \'Update\'', res, 409, 'apricotservice');
      } else {
        await this.apricotProxy['SetRuntimeEntry']({component: COMPONENT, key: envConf.id, value: envConf.toString()});
        log.info(`${req.session.username} successfully saved new core environment configuration "${envConf.id}"`);
        res.status(201).json({message: `Configuration successfully saved as ${envConf.id}`});
      }
    } catch (error) {
      errorHandler(error, res, 503, 'apricotservice');
    }
  }

  /**
   * Receive request to update a configuration for a CoreEnvConfig;
   * * Parses data to be saved including user data and attempt to save it via Apricot
   * * If name of the configuration already exists checks if the user is admin or the author of the existing configuration.
   * * If it is not, throw an error. Otherwise, updates the configuration;
   * @param {Request} req - HTTP Object with data on the configuration to be saved/updated
   * @param {Response} res - HTTP Object used to send a response back to the client with the status of its action
   * @returns {void}
   */
  async updateCoreEnvConfig(req, res) {
    try {
      const data = req.body;
      const user = new User(req.session);
      data.user = user;
      const envConf = CoreEnvConfig.fromJSON(data);

      const envConfigToSave = await this._getUpdatedConfigIfExists(envConf, user);
      await this.apricotProxy['SetRuntimeEntry']({
        component: COMPONENT,
        key: envConfigToSave.id,
        value: envConfigToSave.toString()
      });
      log.info(`${req.session.username} successfully updated existing core environment configuration "${envConf.id}"`);
      res.status(200).json({message: `Successfully updated configuration: ${envConf.id}`});
    } catch (error) {
      errorHandler(error, res, 503, 'apricotservice');
    }
  }

  /**
   * Helpers
   */

  /**
   * Method to update existing configuration with the new one if user has permissions to do so;
   * * If the configuration name does not exist, any user is allowed to create one, thus same configuration will be returned;
   * * If the configuration already exists, only admins or the original author can update it
   * * * If user is allowed to update the configuration, the existing configuration data will be returned;
   * * * If the user is not allowed to update, an error will be thrown;
   * @param {CoreEnvConfig} envConfig - configuration unique id to be searched by
   * @param {Session} user - object containing information with regards to user requesting the action
   * @returns {Promise<JSON,Error>} - if user is not allowed, an error will be thrown
   */
  async _getUpdatedConfigIfExists(envConfig, user) {
    let existingConfig = '';
    try {
      const {payload: envConfigAsString} = await this.apricotProxy['GetRuntimeEntry']({
        component: COMPONENT,
        key: envConfig.id,
      });
      existingConfig = CoreEnvConfig.fromString(envConfigAsString);
    } catch (error) {
      errorLogger(error, 'apricotservice');
      throw new Error(`Unable to find any existing configuration named: ${envConfig.id}`);
    }

    if (!existingConfig.isUpdatableBy(user)) {
      throw new Error(`Configuration '${envConfig.id}' exists already and you do NOT have permissions to update it!`);
    }
    envConfig.applyUpdatableParams(existingConfig);
    return envConfig;
  }
}

module.exports = ApricotService;
