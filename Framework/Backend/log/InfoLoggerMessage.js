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

const {LogLevel} = require('./LogLevel.js');
const {LOG_SEVERITIES, LogSeverity} = require('./LogSeverity.js');

const DEFAULT_SEVERITY = LogSeverity.INFO;
const DEFAULT_LEVEL = LogLevel.DEVELOPER;
const DEFAULT_SYSTEM = 'GUI';
const DEFAULT_FACILITY = 'gui';

/**
 * @typedef InfoLoggerMessageOptions
 *
 * @property {string} [severity] - one of InfoLogger supported severities {@see LogSeverity}
 * @property {number|string} [level] - one of InfoLogger supported levels {@see LogLevel}
 * @property {string} [system] - the name of the system running the process
 * @property {string} [facility] - the name of the module/library injecting the message
 * @property {string} [environmentId] - the id of the environment the log relates to (if it applies)
 * @property {string} [partition] - deprecated: use `environmentId`
 * @property {number} [runNumber] - the run number run the log relates to (if it applies)
 * @property {number} [run] - deprecated: use `runNumber`
 * @property {string} [errorSource] - the name of the file from which the message is injected
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

    this._severity = DEFAULT_SEVERITY;
    this._level = DEFAULT_LEVEL;
    this._system = DEFAULT_SYSTEM;
    this._facility = DEFAULT_FACILITY;
    this._environmentId = undefined;
    this._runNumber = undefined;
    this._errorSource = undefined;
  }

  /**
   * Given a JSON object, parse through its values and return an InfoLoggerMessage with default values for missing ones
   * @param {Partial<InfoLoggerMessageOptions>&object} logObject - object with all or partial InfoLoggerMessage fields
   * @param {string} [logObject.message] the message content itself
   * @returns {InfoLoggerMessage}
   */
  static fromObject(logObject) {
    const log = new InfoLoggerMessage();
    log._severity = logObject.severity && LOG_SEVERITIES.includes(logObject.severity)
      ? logObject.severity
      : LogSeverity.INFO;
    log._level = parseInt(logObject?.level) || LogLevel.DEVELOPER;
    log._system = logObject.system ?? DEFAULT_SYSTEM;
    log._facility = logObject.facility ?? DEFAULT_FACILITY;
    log._environmentId = logObject.environmentId ?? logObject.partition;
    log._runNumber = logObject.runNumber ?? logObject.run;
    log._errorSource = logObject.errorSource;
    log._message = logObject.message ?? '';
    return log;
  }

  /**
   * The current InfoLoggerMessage, returns an array of components with their associated labels that can be sent
   * to InfoLoggerServer
   * @returns {Array<string>}
   */
  getComponentsOfMessage() {
    const components = [
      `-oSeverity=${this._severity}`, `-oLevel=${this._level}`,
      `-oSystem=${this._system}`, `-oFacility=${this._facility}`,
    ];
    if (this._environmentId) {
      components.push(`-oPartition=${this._environmentId}`);
    }
    if (this._runNumber) {
      components.push(`-oRun=${this._runNumber}`);
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
