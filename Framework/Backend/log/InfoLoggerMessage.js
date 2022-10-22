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

/**
 * TypeDefinition for InfoLoggerMessage Object
 * @docs https://github.com/AliceO2Group/InfoLogger/blob/master/doc/README.md
 */
class InfoLoggerMessage {

  /**
   * Construct a default InfoLoggerMessage
   */
  constructor() {
    this._message = '';

    this._severity = 'Info'; // Info (default), Error, Fatal, Warning, Debug
    this._level = 11;
    this._username = 'gui';
    this._system = 'GUI';
    this._facility = 'gui'
    this._rolename = undefined;
    this._partition = undefined;
    this._run = undefined;
    this._errorSource = undefined;
  }

  /**
   * Given a JSON object, parse through its values and return an InfoLoggerMessage with default values for missing ones
   * @param {JSON} logJson - object with all or partial InfoLoggerMessage fields
   * @returns {InfoLoggerMessage}
   */
  static fromJSON(logJson) {
    const log = new InfoLoggerMessage();
    log._severity = logJson.severity && ['Info', 'Error', 'Fatal', 'Warning', 'Debug'].includes(logJson.severity) ?
      logJson.severity : 'Info';
    log._level = Number.isInteger(logJson?.level) ? logJson.level : 11;
    log._username = logJson.username ?? 'gui';
    log._system = logJson.system ?? 'GUI';
    log._facility = logJson.facility ?? 'gui';
    log._rolename = logJson.rolename;
    log._partition = logJson.partition;
    log._run = logJson.run;
    log._errorSource = logJson.errorSource;
    log._message = logJson.message ?? '';
    return log;
  }

  /**
   * The current InfoLoggerMessage, returns an array of components with their associated labels that can be sent 
   * to InfoLoggerServer
   * @returns {Array<string>}
   */
  getComponentsOfMessage() {
    const components = [
      `-oSeverity=${this._severity}`, `-oLevel=${this._level}`, `-oUsername=${this._username}`,
      `-oSystem=${this._system}`, `-oFacility=${this._facility}`
    ];
    if (this._rolename) {
      components.push(`-oRolename=${this._rolename}`);
    }
    if (this._partition) {
      components.push(`-oPartition=${this._partition}`);
    }
    if (this._run) {
      components.push(`-oRun=${this._run}`);
    }
    if (this._errorSource) {
      components.push(`-oErrorSource=${this._errorSource}`);
    }
    components.push(InfoLoggerMessage._removeNewLinesAndTabs(this._message));
    return components;
  }

  /**
   * Replace all occurrences of new lines, tabs or groups of 4 spaces with an empty space
   * @param {Object|Error|String} log
   * @return {String}
   */
  static _removeNewLinesAndTabs(log) {
    try {
      if (log instanceof Error) {
        return log.toString().replace(/ {4}|[\t\n\r]/gm, ' ');
      } else if (log instanceof Object) {
        return JSON.stringify(log).replace(/ {4}|[\t\n\r]/gm, ' ');
      }
      return log.replace(/ {4}|[\t\n\r]/gm, ' ');
    } catch (error) {
      return '';
    }
  }
}

module.exports = InfoLoggerMessage;
