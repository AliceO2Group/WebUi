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
   * Returns the Restrictions in case the array they are calculated for is empty
   * and we can not derive the type of values held in there
   * Restrictions for an array always has the following structure
   * At index 0 there are Restrictions for every value currently in the array
   * At index 1 there are Restrictions in case the user adds a new item to the array
   */
  static get emptyArrayRestrictions() {
    return [[], {}];
  }

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
    if (typeof value === 'number') { return 'number'; }
    if (typeof value === 'boolean' || value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'false') {
      return 'boolean';
    }
    if (!Number.isNaN(Number(value))) { return 'number'; }
    if (typeof value === 'string') { return 'string'; }
    const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/qc-conf-adapter`);
    logger.warnMessage(`Unknown value encountered while calculating restrictions from a configuration: ${value}`);
    return 'unknown';
  };

  /**
   * Derive the type of values in an array
   * When deriving restrictions for an array, we gather two pieces of data:
   *  - itemsRestrictions: a list of types for every object held inside
   *  - newItemRestrictions: a blueprint for a new item in the array
   * @param {Array} array for which we calculate the Restrictions
   * @returns {ArrayRestrictions} value describing the nature of objects held in an array
   */
  static deriveArrayType = (array) => {
    if (array.length === 0) {
      return QCConfigurationAdapter.emptyArrayRestrictions;
    }

    let maximumIntersection = QCConfigurationAdapter.deriveValueType(array[0]);
    const itemsRestrictions = [maximumIntersection];
    for (let i = 1; i < array.length; i++) {
      const currentItemRestrictions = QCConfigurationAdapter.deriveValueType(array[i]);
      itemsRestrictions.push(currentItemRestrictions);
      maximumIntersection = QCConfigurationAdapter.getRestrictionIntersection(
        maximumIntersection,
        currentItemRestrictions
      );
    }

    return [itemsRestrictions, maximumIntersection];
  }

  /**
   * Function which finds maximum intersection for two different Restrictions
   * @param {Restrictions} first 
   * @param {Restrictions} second 
   */
  static getRestrictionIntersection = (first, second) => {
    if (typeof first === 'string' && typeof second === 'string') {
      return first === second ? first : null; // primitive types differ
    }
    if (typeof first === 'string' || typeof second === 'string') {
      // `first` is primitive or `second` is primitive but not both
      return null;
    }

    if (Array.isArray(first) && Array.isArray(second)) {
      return QCConfigurationAdapter.emptyArrayRestrictions;
    }
    if (Array.isArray(first) || Array.isArray(second)) {
      // `first` is an array or `second` is an array but not both
      return null;
    }

    // from now on, `first` and `second` can only describe objects
    const restrictions = {};
    Object.entries(first).forEach(([key, val]) => {
      if (!(key in second)) { return; }
      const maximumIntersection = QCConfigurationAdapter.getRestrictionIntersection(val, second[key]);
      if (maximumIntersection === null) { return; }
      restrictions[key] = maximumIntersection;
    });
    return restrictions;
  }
}

module.exports = QCConfigurationAdapter;
