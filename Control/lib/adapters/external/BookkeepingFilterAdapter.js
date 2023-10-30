/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * @class
 * BookkeepingFilterAdapter - Class that allows adapting given objects to string filters as accepted by Bookkeeping HTTP API
 */
class BookkeepingFilterAdapter {

  /**
   * @constructor
   * BookkeepingFilterAdapter
   */
  constructor() { }

  /**
   * @static
   * Given an object with keys and values representing filters to be applied on requests to Bookkeeping,
   * return a string format filter ready to be used in requests towards Bookkeeping
   * @see https://github.com/AliceO2Group/Bookkeeping/blob/main/lib/domain/dtos/filters/RunFilterDto.js
   * @param {Object<String, String|Object>} filterMap - object map with KV for filters
   * @return {String} - as understood by Bookkeeping HTTP API
   */
  static toString(filterMap) {
    const {detectors, runTypes, definitions, calibrationStatuses, limit = 1} = filterMap;
    let filter = `page[limit]=${limit}`;

    if (detectors) {
      let operator = 'and';
      let values = '';
      if (typeof detectors === 'object') {
        if (detectors.operator === 'and' || detectors.operator === 'or') {
          operator = detectors.operator;
        }
        if (detectors.values) {
          values = detectors.values;
        }
      } else {
        values = detectors;
      }
      const valuesAsString = BookkeepingFilterAdapter._parseValueIntoString(values);
      filter += `&filter[detectors][operator]=${operator}&filter[detectors][values]=${valuesAsString}`;
    }

    const runTypesString = BookkeepingFilterAdapter._parseValueIntoString(runTypes);
    if (runTypesString) {
      filter += `&filter[runTypes]=${runTypesString}`;
    }
    const definitionsString = BookkeepingFilterAdapter._parseValueIntoString(definitions)
    if (definitionsString) {
      filter += `&filter[definitions]=${definitionsString}`;
    }

    const calibrationStatusesString = BookkeepingFilterAdapter._parseValueIntoString(calibrationStatuses);
    if (calibrationStatusesString) {
      filter += `&filter[calibrationStatuses][]=${calibrationStatusesString}`;
    }
    return filter;
  }

  /**
   * @static
   * Given a string or array, parse the value into a string with entities delimited by comma
   * @param {Array|String} value - value to parse
   * @return {String}
   */
  static _parseValueIntoString(value) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    } else if (Array.isArray(value) && value.length > 0) {
      return value.join(',');
    } else if (typeof value === 'number') {
      return new String(value)
    }
    return null;
  }
}

module.exports.BookkeepingFilterAdapter = BookkeepingFilterAdapter;
