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
const KNOWN_RUN_TYPES = ['SYNTHETIC', 'PHYSICS', 'COSMICS', 'TECHNICAL', 'REPLAY'];
const KNOWN_FLPS = ['alio2-cr1-flp145'];

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
   * Checks for mandatory fields and parses variables to:
   * - replace new lines with spaces
   * @param {EnvironmentCreation} payload -  configuration for creating an environment in raw format
   * @return {EnvironmentCreation} - validated and parsed configuration 
   */
  static parseEnvironmentCreationPayload(payload) {
    const {workflowTemplate, vars} = payload;
    if (!workflowTemplate || !vars) {
      throw new Error(`Missing mandatory parameter 'workflowTemplate' or 'vars'`)
    }
    payload = CoreUtils._removeFlpBasedOnRunType(payload);
    Object.keys(vars).forEach((key) => vars[key] = vars[key].trim().replace(/\r?\n/g, ' '));
    return payload;
  }

  /**
   * Temporal removal of bad FLP host if run_type is as per specified
   * @param {EnvironmentCreation} payload -  configuration for creating an environment in raw format
   * @returns {EnvironmentCreation} - validated and parsed configuration 
   */
  static _removeFlpBasedOnRunType(payload) {
    try {
      const {vars} = payload;
      const {run_type = ''} = vars;
      if (KNOWN_RUN_TYPES.includes(run_type.toLocaleUpperCase())) {
        const {hosts} = vars;
        const hostsJson = JSON.parse(hosts);
        KNOWN_FLPS.forEach((knownHost) => {
          try {
            const index = hostsJson.findIndex((host) => knownHost === host);
            if (index >= 0) {
              hostsJson.splice(index, 1);
            }
            vars.hosts = JSON.stringify(hostsJson);
            payload.vars = vars;
          } catch (error) {
            console.error(error);
          }
        });
      }
    } catch (error) {
      console.error(error)
    }

    return payload;
  }
}

module.exports = CoreUtils;
