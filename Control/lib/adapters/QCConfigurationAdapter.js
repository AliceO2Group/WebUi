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
   * 
   * For example, for array like:
   * [
   *   { name: 'flp1', strength: 10, isActive: true },
   *   { name: 'flp2', strength: 100000, isActive: 'inactive' }
   * ]
   * 
   * The ArrayRestrictions will be:
   * [
   *   [
   *     { name: 'string', strength: 'number', isActive: 'boolean' },
   *     { name: 'string', strength: 'number', isActive: 'string' }
   *   ],
   *   { name: 'string', strength: 'number' }
   * ]
   */
  static get emptyArrayRestrictions() {
    return [[], {}];
  }

  /**
   * Derive type of value for every key-val pair of given configuration object
   * @param {Object} configuration object we want to get restrictions of
   * @returns {Restrictions} derived restrictions for a given configuration
   */
  static computeRestrictions = (value) => {
    const restrictions = {};
    if (typeof value !== 'object' || value === null) {
      return restrictions;
    }
    Object.entries(value).forEach(([key, val]) => (restrictions[key] = QCConfigurationAdapter.deriveValueType(val)));
    return restrictions;
  };

  /**
   * Derive the type of a value and return it as a string
   * possible types are Restrictions or ArrayRestrictions
   * @param {string | number | boolean | Array | Object} value that we want to get the Restrictions of
   * @returns {Restrictions | ArrayRestrictions} type derived from the given value,
   * could be a string, Restrictions object, or ArrayRestrictions object
   */
  static deriveValueType = (value) => {
    if (Array.isArray(value)) { return QCConfigurationAdapter.deriveArrayType(value); }
    if (typeof value === 'object' && value !== null) { return QCConfigurationAdapter.computeRestrictions(value); }
    if (typeof value === 'boolean' || typeof value === 'string' &&
      (value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'false')) {
      return 'boolean';
    }
    if (typeof value === 'number' || (!isNaN(Number(value)) && value.trim() !== '')) { return 'number'; }
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

    if (Array.isArray(maximumIntersection)) {
      // we only want to save the blueprint of a nested array as a blueprint
      maximumIntersection = [[], maximumIntersection[1]];
    }

    return [itemsRestrictions, maximumIntersection];
  }

  /**
   * Function which finds maximum intersection for two different Restrictions
   * @param {Restrictions | ArrayRestrictions} first 
   * @param {Restrictions | ArrayRestrictions} second 
   */
  static getRestrictionIntersection = (first, second) => {
    if (QCConfigurationAdapter.bothArePrimitive(first, second)) {
      // the intersection returns the value type, or null if types are different
      return first === second ? first : null;
    }

    if (QCConfigurationAdapter.bothAreArrays(first, second)) {
      // intersection of two ArrayRestrictions objects is an empty array
      // with blueprint calculated by intersecting the Restrictions
      return [[], QCConfigurationAdapter.getRestrictionIntersection(first[1], second[1])];
    }

    if (QCConfigurationAdapter.bothAreObjects(first, second)) {
      const restrictions = {};
      Object.entries(first).forEach(([key, val]) => {
        if (!(key in second)) { return; }
        const maximumIntersection = QCConfigurationAdapter.getRestrictionIntersection(val, second[key]);
        if (maximumIntersection === null) { return; }
        restrictions[key] = maximumIntersection;
      });
      return restrictions;
    }

    return null; // first and second differ
  }

  static bothArePrimitive = (first, second) => {
    return typeof first === 'string' && typeof second === 'string';
  }

  static bothAreArrays = (first, second) => {
    return Array.isArray(first) && Array.isArray(second);
  }

  static bothAreObjects = (first, second) => {
    return typeof first === 'object' && first !== null && typeof second === 'object' && second !== null;
  }
}

module.exports = QCConfigurationAdapter;
