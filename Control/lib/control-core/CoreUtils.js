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

const { InvalidInputError } = require('@aliceo2/web-ui');

/**
 * Shared methods used within Core Services/Controllers
 */
class CoreUtils {
  /**
   * Constructor initializing dependencies
   */
  constructor() { }

  /**
   * Given a core response with framework info, filter out
   * data which should not be displayed to the user
   * @param {JSON} info 
   */
  static parseFrameworkInfo(info) {
    delete info.detectorsInInstance;
    delete info.activeDetectors;
    delete info.availableDetectors;
    return info;
  }

  /**
   * Method to remove `/` if exists from method name
   * @param {string} method
   * @return {string}
   */
  static parseMethodNameString(method) {
    if (method === '/core/request') {
      return 'NewEnvironment'
    } else if (method?.startsWith('/execute/')) {
      return 'NewAutoEnvironment';
    }
    return method?.indexOf('/') === 0 ? method.substring(1, method.length) : method;
  }

  /**
   * Parse the JSON of the version and return it as a string
   * @param {JSON} versionJSON
   * @return {string}
   */
  static parseAliEcsVersion(versionJSON) {
    let version = '';
    if (versionJSON.productName) {
      version += versionJSON.productName;
    }
    if (versionJSON.versionStr) {
      version += ' ' + versionJSON.versionStr;
    }
    if (versionJSON.build) {
      version += ' (revision ' + versionJSON.build + ')';
    }
    return version;
  }

  /**
   * Given a payload with properties, extract the runType one
   * @param {EnvironmentCreation} environmentPayload - object with properties required to create an environment
   * @return {String} runType of the environment creation.
   */
  static getRunType(environmentPayload) {
    const {vars} = environmentPayload;
    return  vars['run_type'] ?? null;
  }

  /**
   * Checks for mandatory fields and parses variables to:
   * - replace new lines with spaces
   * @param {EnvironmentCreation} payload -  configuration for creating an environment in raw format
   * @param {Array<String>} hostsToIgnore - list of hosts that should be removed from payload
   * @return {EnvironmentCreation} - validated and parsed configuration 
   */
  static parseEnvironmentCreationPayload(payload, hostsToIgnore = []) {
    const {workflowTemplate, vars} = payload;
    if (!workflowTemplate || !vars) {
      throw new Error(`Missing mandatory parameter 'workflowTemplate' or 'vars'`)
    }
    payload = CoreUtils._removeHostsFromSelection(payload, hostsToIgnore);
    Object.keys(vars).forEach((key) => vars[key] = vars[key].trim().replace(/\r?\n/g, ' '));
    return payload;
  }

  /**
   * Remove hosts that are defined in the kvStore from the list of hosts that are to be used for the deployment
   * @param {EnvironmentCreation} payload -  configuration for creating an environment in raw format
   * @param {Array<String>} hostsToIgnore - list of hosts that should be removed from payload
   * @returns {EnvironmentCreation} - validated and parsed configuration 
   * @throws {Error} if no hosts are left after removing the ones in kvStore
   */
  static _removeHostsFromSelection(payload, hostsToIgnore = []) {
    const hostsAsString = payload?.vars?.hosts ?? '[]';
    let hostsList = [];

    try {
      hostsList = JSON.parse(hostsAsString);
      if (!Array.isArray(hostsList)) {
        throw new InvalidInputError(`Hosts from deployment payload should be an array, but got ${typeof hostsList}`);
      }
    } catch (error) {
      throw new InvalidInputError(`Invalid hosts JSON: ${hostsAsString} (${error})`);
    }

    const filteredHosts = hostsList.filter((host) => !hostsToIgnore.includes(host));
    if (filteredHosts.length === 0) {
      const hostListString = hostsList.join(', ').slice(0, 100);
      throw new InvalidInputError(`No hosts remained after ignoring the ones in store: ${hostListString}`);
    }
    payload.vars.hosts = JSON.stringify(filteredHosts);

    return payload;
  }
}

module.exports = CoreUtils;
