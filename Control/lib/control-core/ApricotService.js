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
const {errorHandler} = require('./../utils.js');
const CoreUtils = require('./CoreUtils.js');
const COMPONENT = 'COG-v1';

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
        ?? 'Could not establish connection to AliECS Core due to pontentially undefined method';
      errorHandler(error, res, 503, 'apricotservice');
    }
  }

  /**
   * Receive request to save a configuration for creating a new environment
   * * Parses data to be saved including user data and attempt to save it via Apricot
   * * If name of the configuration already exists an error message will be sent back to the user
   * @param {Request} req
   * @param {Response} res
   */
  async saveConfiguration(req, res) {
    try {
      const {key, value} = this._buildConfigurationObject(req);
      const {payload: existingConfs} = await this.apricotProxy['ListRuntimeEntries']({component: COMPONENT});
      if (existingConfs.includes(key)) {
        errorHandler(`A configuration with name '${value.name}' already exists`, res, 409, 'apricotservice');
      } else {
        await this.apricotProxy['SetRuntimeEntry']({component: COMPONENT, key, value: JSON.stringify(value, null, 2)});
        res.status(200).json({message: `Configuration saved successfully as ${key}`})
      }
    } catch (error) {
      errorHandler(error, res, 503, 'apricotservice');
    }
  }

  /*
   * Helpers
  */

  /**
   * Builds configuration object to be stored in Apricot based on request
   * @param {Request} req
   * @returns {JSON}
   */
  _buildConfigurationObject(req) {
    const missingFields = [];
    if (!req.body?.name) {
      missingFields.push('name');
    }
    if (!req.body?.detectors) {
      missingFields.push('detectors');
    }
    if (!req.body?.workflow) {
      missingFields.push('workflow');
    }
    if (!req.body?.repository) {
      missingFields.push('repository');
    }
    if (!req.body?.revision) {
      missingFields.push('revision');
    }

    if (missingFields.length !== 0) {
      throw new Error(`Configuration cannot be saved without the following fields: ${missingFields.toString()}`)
    } else {
      const user = {
        username: req?.session?.username ?? 'anonymous',
        personid: req?.session?.personid ?? 0
      };
      const created = Date.now();
      const edited = Date.now();
      const variables = req.body?.variables ?? {};
      const detectors = req.body.detectors;
      const workflow = req.body.workflow;
      const revision = req.body.revision;
      const repository = req.body.repository;
      const name = req.body.name;
      const id = this._getNameAsId(name);
      return {
        key: id, value: {
          user, created, edited, variables, workflow, repository, revision, detectors, name, id
        }
      };
    }
  }

  /**
   * Build the ID of the configuration to be saved from the name:
   * * Replace any existing `/` from it with `_` so that Apricot is able to understand Consul storage
   * * Replace any spaces from it with `_`
   * @param {String} name 
   * @returns {String}
   */
  _getNameAsId(name) {
    return `${name.trim().replace(/ /g, '_')}`.replace(/\//g, '_');
  }
}

module.exports = ApricotService;
