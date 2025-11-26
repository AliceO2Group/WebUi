/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const { LogManager } = require('@aliceo2/web-ui');

/**
 * QCConfigurationAdapter - Given aconfiguration object, construct Restrictions
 * which is a set of restrictions based on the values contained in this configuration
 */
class QCConfigurationAdapter {
  /**
   * Derive type of value for every key-val pair
   * of given configuration object
   * @param {Object} configuration object we want to get restrictions of
   * @returns {Restrictions} derived restrictions for a given configuration
   */
  static computeRestrictions = (value) => {
    const restrictions = {};
    if (typeof value !== 'object' || Array.isArray(value) || value === null) {
      return restrictions;
    }
    Object.entries(value).forEach(([key, val]) => (restrictions[key] = QCConfigurationAdapter.deriveValueType(val)));
    return restrictions;
  };

  /**
   * Derive the type of value and return it as a string
   * possible types are 'string', 'boolean', 'number', 'array<`${NestedRestrictions}`>', `${NestedRestrictions}`
   * @param {string | Array | Object} value that we want to get the Restrictions of
   * @returns {string | Restrictions} derived type from the given value, could be a string, or further nested Restrictions
   */
  static deriveValueType = (value) => {
    // TODO OGUI-1803: implement function _combineTypes, so we can derive Type of value[0] and
    // then combine it with Types of value[1], value[2] and so on to get the overall Type of values held in the array
    if (Array.isArray(value)) { return 'array'; }
    if (value instanceof Object) { return QCConfigurationAdapter.computeRestrictions(value); }
    if (value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'false') {
      return 'boolean';
    }
    if (!Number.isNaN(Number(value))) { return 'number'; }
    if (typeof value === 'string') { return 'string'; }
    const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/qc-conf-adapter`);
    logger.warnMessage(`Unknown value encountered while calculating restrictions from a configuration: ${value}`);
    return 'unknown';
  };
}

module.exports = QCConfigurationAdapter;
