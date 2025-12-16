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
   * Derive the type of a value and return it as a string
   * possible types are Restrictions or ArrayRestrictions
   * @param {string | number | boolean | Array | Object} value that we want to get the Restrictions of
   * @returns {Restrictions | ArrayRestrictions} type derived from the given value,
   * could be a string, Restrictions object, or ArrayRestrictions object
   */
  static deriveValueType = (value) => {
    if (Array.isArray(value)) { return QCConfigurationAdapter.computeArrayRestrictions(value); }

    if (typeof value === 'object' && value !== null) { return QCConfigurationAdapter.computeObjectRestrictions(value); }

    if (typeof value === 'boolean' || typeof value === 'string' &&
      (value.toLocaleLowerCase() === 'true' || value.toLocaleLowerCase() === 'false')
    ) { return 'boolean'; }

    if (typeof value === 'number' || typeof value === 'string' &&
      (!isNaN(Number(value)) && value.trim() !== '')
    ) { return 'number'; }

    if (typeof value === 'string') { return 'string'; }

    const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'cog'}/qc-conf-adapter`);
    logger.warnMessage(
      `Unknown value encountered while calculating restrictions from a configuration: ${value}`
    );

    return 'unknown';
  };

  /**
   * Derive type of value for every key-val pair of given configuration object
   * @param {Object} configuration object we want to get restrictions of
   * @returns {Restrictions} derived restrictions for a given configuration
   */
  static computeObjectRestrictions = (value) => {
    const restrictions = {};
    if (!QCConfigurationAdapter.isObject(value)) { return restrictions; }
    Object.entries(value).forEach(
      ([key, val]) => (restrictions[key] = QCConfigurationAdapter.deriveValueType(val))
    );
    return restrictions;
  };

  /**
   * Compute the type of values in an array
   * When computing restrictions for an array, we gather three pieces of data:
   *  - itemsRestrictions: a list of types for every object held inside
   *  - innerObjectRestrictions: a blueprint for a new item in the array
   *  - innerArrayRestrictions: a blueprint of directly nested, newly created array
   * @param {Array} array for which we calculate the Restrictions
   * @returns {ArrayRestrictions} value describing the nature of objects held in an array
   */
  static computeArrayRestrictions = (array) => {
    if (array.length === 0) {
      return QCConfigurationAdapter.emptyArrayRestrictions;
    }

    const firstItem = array[0];
    const firstItemRestrictions = QCConfigurationAdapter.deriveValueType(firstItem);
    let innerObjectBlueprint = QCConfigurationAdapter.isObject(firstItem) ? firstItemRestrictions : null;
    let innerArrayBlueprint = Array.isArray(firstItem) ? firstItemRestrictions : null;
    const itemsRestrictions = [firstItemRestrictions];

    for (let i = 1; i < array.length; i++) {
      const currentItemRestrictions = QCConfigurationAdapter.deriveValueType(array[i]);
      itemsRestrictions.push(currentItemRestrictions);

      if (QCConfigurationAdapter.isPrimitive(currentItemRestrictions)) { continue; } // skip primitives

      if (QCConfigurationAdapter.isObject(currentItemRestrictions)) {
        innerObjectBlueprint = QCConfigurationAdapter.getRestrictionsIntersection(
          innerObjectBlueprint,
          currentItemRestrictions
        );
      }

      if (Array.isArray(currentItemRestrictions)) {
        innerArrayBlueprint = QCConfigurationAdapter.getRestrictionsIntersection(
          innerArrayBlueprint,
          currentItemRestrictions
        );
      }
    }

    return [itemsRestrictions, innerObjectBlueprint, innerArrayBlueprint];
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

    if (QCConfigurationAdapter.arrayIntersectionCondition(first, second)) {
      // intersection of two ArrayRestrictions objects
      return QCConfigurationAdapter.getArrayRestrictionsIntersection(first, second);
    }

    if (QCConfigurationAdapter.objectIntersectionCondition(first, second)) {
      return QCConfigurationAdapter.getObjectRestrictionsIntersection(first, second);
    }

    return null;
  };

  /**
   * Function used to calculate the intersection of blueprints of two arrays.
   * 
   * The value at index 0 of both arrays is excessive, since it describes the values
   * currently held in there which is irrelevant when user chooses to create new,
   * empty array (which will use the ArrayRestricitons we are calculating right now)
   * 
   * The values at index 1 (describing objects directly in the array) and
   * the values at index 2 (describing arrays directly in the array)
   * are calculated as usual
   * 
   * If one of the arguments is an array and the other one is null,
   * the proper array is considered the valid blueprint
   * @param {Array | null} first 
   * @param {Array | null} second 
   * @returns {ArrayRestrictions}
   */
  static getArrayRestrictionsIntersection = (first, second) => {
    if (first === null && second === null) { return null; }

    // in both cases we drop excessive data because the newly created arrays will be empty anyway
    if (first === null) { return [[], second[1], second[2]]; }
    if (second === null) { return [[], first[1], first[2]]; }

    return [
      [],
      QCConfigurationAdapter.getRestrictionsIntersection(first[1], second[1]),
      QCConfigurationAdapter.getRestrictionsIntersection(first[2], second[2]),
    ];
  };

  /**
   * Function used to calculate the intersection of blueprints of two objects.
   * If one of the arguments is an object and the other one is null,
   * the proper object is considered the valid blueprint
   * @param {Object | null} first 
   * @param {Object | null} second 
   * @returns {Restrictions}
   */
  static getObjectRestrictionsIntersection = (first, second) => {
    if (first === null) { return second; }
    if (second === null) { return first; }

    const restrictions = {};
    Object.entries(first).forEach(([key, val]) => {
      if (!(key in second)) { return; }
      const maximumIntersection = QCConfigurationAdapter.getRestrictionsIntersection(val, second[key]);
      // we skip empty intersection or empty keys which are used for documentation
      if (maximumIntersection === null || key.trim() === '') { return; }
      restrictions[key] = maximumIntersection;
    });
    return restrictions;
  }

  /**
   * A primitive value in this context is a description of value held in Configuration.
   * This means that when we encounter a primitive value, we describe it (using Restrictions) with a string.
   * Otherwise we define that this Restriction do not describe a primitive value, but rather an Array or an Object
   * @param {any} value
   * @returns {boolean} true if the values provided describes a primitive value held in Configuration
   */
  static isPrimitive = (value) => typeof value === 'string';

  /**
   * Function designed to check if value passed is an Object specifically, excluding null and arrays
   * @param {any} value 
   * @returns 
   */
  static isObject = (value) => (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );

  /**
   * For the definition of primitives in context of the Restrictions see the JSDoc of `isPrimitive` function above
   * @param {any} first 
   * @param {any} second 
   * @returns {boolean} true if both values describe primitives
   */
  static bothArePrimitive = (first, second) => {
    return QCConfigurationAdapter.isPrimitive(first) && QCConfigurationAdapter.isPrimitive(second);
  }

  /**
   * Function to determine if we can perform ArrayRestrictions intersection
   * This intersection is possible only if:
   * both first and second are arrays
   * at least one of them in an array and the other one is null
   * @param {string | Object | Array | null} first 
   * @param {string | Object | Array | null} second 
   * @returns {boolean} info if we should intersect the ArrayRestrictions
   */
  static arrayIntersectionCondition = (first, second) => {
    if (first === null && second === null) { return false; }
    if (
      (Array.isArray(first) || first === null) &&
      (Array.isArray(second) || second === null)
    ) { return true; }
    return false;
  }

  /**
   * Function to determine if we can perform Restrictions intersection
   * This intersection is possible only if:
   * both first and second are objects
   * at least one of them in an object and the other one is null
   * @param {string | Object | Array | null} first 
   * @param {string | Object | Array | null} second 
   * @returns {boolean} info if we should intersect the Restrictions
   */
  static objectIntersectionCondition = (first, second) => {
    if (first === null && second === null) { return false; }
    if (
      (QCConfigurationAdapter.isObject(first) || first === null) &&
      (QCConfigurationAdapter.isObject(second) || second === null)
    ) { return true; }
    return false;
  };
}

module.exports = QCConfigurationAdapter;
