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
   * At index 1 there are Restrictions in case the user adds a new object to the array
   * At index 2 there are Restrictions in case user creates new, directly nested array
   *
   * For example, for array like:
   * [
   *   { name: 'flp1', strength: 10, isActive: true },
   *   { name: 'flp2', strength: 100000, isActive: 'inactive' },
   * ]
   *
   * The ArrayRestrictions will be:
   * [
   *   [
   *     { name: 'string', strength: 'number', isActive: 'boolean' },
   *     { name: 'string', strength: 'number', isActive: 'string' }
   *   ],
   *   { name: 'string', strength: 'number' },
   *   null // because input array does not contain nested arrays
   * ]
   * 
   * To see an example of calculating the Restrictions at index 2, see tests
   * because writing it in here would bloat the example
   */
  static get emptyArrayRestrictions() {
    return [[], null, null];
  }

  /**
   * Derive type of value for every key-val pair of given configuration object
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
   * Derive the type of a value and return it as a string
   * possible types are Restrictions or ArrayRestrictions
   * @param {string | number | boolean | Array | Object} value that we want to get the Restrictions of
   * @returns {Restrictions | ArrayRestrictions} type derived from the given value,
   * could be a string, Restrictions object, or ArrayRestrictions object
   */
  static deriveValueType = (value) => {
    if (Array.isArray(value)) { return QCConfigurationAdapter.computeArrayRestrictions(value); }
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
   * When deriving restrictions for an array, we gather three pieces of data:
   *  - itemsRestrictions: a list of types for every object held inside
   *  - newObjectRestrictions: a blueprint for a new item in the array
   *  - newArrayRestrictions: a blueprints to pass into directly nested newly created array
   * @param {Array} array for which we calculate the Restrictions
   * @returns {ArrayRestrictions} value describing the nature of objects held in an array
   */
  static computeArrayRestrictions = (array) => {
    if (array.length === 0) {
      return QCConfigurationAdapter.emptyArrayRestrictions;
    }

    const firstItemRestrictions = QCConfigurationAdapter.deriveValueType(array[0]);
    let innerObjectBlueprint = QCConfigurationAdapter.isObjectOnly(array[0]) ?
      firstItemRestrictions : null;
    let [innerArrayObjectBlueprint, innerArrayArrayBlueprint] = Array.isArray(array[0]) ?
      [firstItemRestrictions[1], firstItemRestrictions[2]] : null;
    const itemsRestrictions = [firstItemRestrictions];

    for (let i = 1; i < array.length; i++) {
      const currentItemRestrictions = QCConfigurationAdapter.deriveValueType(array[i]);
      itemsRestrictions.push(currentItemRestrictions);

      if (QCConfigurationAdapter.isPrimitive(currentItemRestrictions)) { continue; } // skip primitives

      if (QCConfigurationAdapter.isObjectOnly(currentItemRestrictions)) {
        innerObjectBlueprint = innerObjectBlueprint === null ?
          currentItemRestrictions :
          QCConfigurationAdapter.getRestrictionsIntersection(
            innerObjectBlueprint,
            currentItemRestrictions
          );

        continue;
      }

      // if the current restrictions describe an array, we intersect object restrictions for them
      // with current object restrictions (for previously calculated values)
      innerArrayObjectBlueprint =
        innerArrayObjectBlueprint === null
          ? currentItemRestrictions
          : QCConfigurationAdapter.getRestrictionsIntersection(
            innerArrayObjectBlueprint,
            currentItemRestrictions[1]
          );

      // we also intersect array restrictions for them
      innerArrayArrayBlueprint =
        innerArrayArrayBlueprint === null
          ? currentItemRestrictions
          : QCConfigurationAdapter.getRestrictionsIntersection(
            innerArrayArrayBlueprint,
            currentItemRestrictions[2]
          );
    }

    return [
      itemsRestrictions,
      innerObjectBlueprint,
      [innerArrayObjectBlueprint, innerArrayArrayBlueprint]
    ];
  };

  /**
   * Function which finds maximum intersection for two different Restrictions
   * only if they describe objects and it returns null otherwise
   * @param {Restrictions} first
   * @param {Restrictions} second
   */
  static getRestrictionsIntersection = (first, second) => {
    if (QCConfigurationAdapter.bothArePrimitive(first, second)) {
      // the intersection returns the value type, or null if types are different
      return first === second ? first : null;
    }

    if (QCConfigurationAdapter.bothAreArrays(first, second)) {
      // intersection of two ArrayRestrictions objects
      return QCConfigurationAdapter.getArrayRestrictionsIntersection(first, second);
    }

    if (QCConfigurationAdapter.bothAreObjects(first, second)) {
      const restrictions = {};
      Object.entries(first).forEach(([key, val]) => {
        if (!(key in second)) { return; }
        const maximumIntersection = QCConfigurationAdapter.getRestrictionsIntersection(val, second[key]);
        if (maximumIntersection === null) { return; }
        restrictions[key] = maximumIntersection;
      });
      return restrictions;
    }

    return null;
  };

  static getArrayRestrictionsIntersection = (first, second) => {
    return [
      [],
      QCConfigurationAdapter.getRestrictionsIntersection(first[1], second[1]),
      QCConfigurationAdapter.getRestrictionsIntersection(first[2], second[2]),
    ];
  };

  static isPrimitive = (value) => typeof value === 'string';

  static isObjectOnly = (value) => (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );

  static bothArePrimitive = (first, second) => {
    return QCConfigurationAdapter.isPrimitive(first) && QCConfigurationAdapter.isPrimitive(second);
  }

  static bothAreArrays = (first, second) => {
    return Array.isArray(first) && Array.isArray(second);
  }

  static bothAreObjects = (first, second) => {
    return QCConfigurationAdapter.isObjectOnly(first) && QCConfigurationAdapter.isObjectOnly(second);
  };
}

module.exports = QCConfigurationAdapter;
