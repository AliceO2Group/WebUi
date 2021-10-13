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

import {Observable} from '/js/src/index.js';

/**
 * @typedef Criteria
 * @type {object}
 * @property {object} field - field name like pid, username, timestamp
 * @property {string} field.operator - $match, $exclude, $since, $until, $min, $max, $in
 */

/**
 * @typedef Criteria * @type {Array.<Criteria>}
 */

/**
 * This class stores raw filters from user (strings) and parsed ones (like Date object).
 * It can generate a function to filter "messages" to be used
 * on server side.
 * It can also import and export an object representing its internal state,
 * this is used to save this state on ILG URL bar.
 */
export default class LogFilter extends Observable {
  /**
   * Instantiate a LogFilter with criteria reset to empty or minimal value
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.resetCriteria();
  }

  /**
   * Set a filter criteria for a field with an operator and value only if the new value is different than the current one.
   * For each field+operator a parsed property in criterias is made with associated cast (Date, number, Array).
   * @param {string} field
   * @param {string} operator
   * @param {string} value
   * @return {boolean}
   * @example
   * setCriteria('severity', 'in', 'W E F')
   * // severity is W or E or F
   * //
   */
  setCriteria(field, operator, value) {
    if (this.criterias[field][operator] !== value) {
      this.criterias[field][operator] = value;
      // auto-complete other properties / parse
      switch (operator) {
        case 'since':
          this.criterias[field]['$since'] = this.model.timezone.parse(value);
          break;
        case 'until':
          this.criterias[field]['$until'] = this.model.timezone.parse(value);
          break;
        case 'min':
          this.criterias[field]['$min'] = parseInt(value, 10);
          break;
        case 'max':
          this.criterias[field]['$max'] = parseInt(value, 10);
          break;
        case 'match':
          this.criterias[field]['$match'] = value ? value : null;
          break;
        case 'exclude':
          this.criterias[field]['$exclude'] = value ? value : null;
          break;
        case 'in':
          this.criterias[field]['$in'] = value ? value.split(' ') : null;
          break;
        default:
          throw new Error('unknown operator');
      }

      this.notify();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Exports all filled filters inputs
   * @return {Object} minimal filter object
   */
  toObject() {
    // copy everything
    const criterias = JSON.parse(JSON.stringify(this.criterias));

    // clean-up the whole structure
    // eslint-disable-next-line guard-for-in
    for (const field in criterias) {
      // eslint-disable-next-line guard-for-in
      for (const operator in criterias[field]) {
        // remote parsed properties (generated with fromJSON)
        if (operator.includes('$')) {
          delete criterias[field][operator];
        }

        // remote empty inputs
        if (!criterias[field][operator]) {
          delete criterias[field][operator];
        } else if (operator === 'match') {
          // encode potential breaking characters
          criterias[field][operator] = encodeURI(criterias[field][operator]);
        }

        // remove empty fields
        if (!Object.keys(criterias[field]).length) {
          delete criterias[field];
        }
      }
    }

    return criterias;
  }

  /**
   * Set criterias according to object passed as argument
   * @param {Criterias} criterias
   */
  fromObject(criterias) {
    this.resetCriteria();
    // copy values to inner filters
    // eslint-disable-next-line guard-for-in
    for (const field in criterias) {
      // eslint-disable-next-line guard-for-in
      for (const operator in criterias[field]) {
        this.setCriteria(field, operator, criterias[field][operator]);
      }
    }

    this.notify();
  }

  /**
   * Generates a function to filter a log passed as argument to it
   * Output of function is boolean.
   * @return {function.<WebSocketMessage, boolean>}
   */
  toFunction() {
    /**
     * This function will be stringified then sent to server so it can filter logs
     * 'DATA_PLACEHOLDER' will be replaced by the stringified filters too so the function contains de data
     * @param {Object} message
     * @return {boolean} true if message passes criterias
     */
    function filterFunction(message) {
      const log = message.payload;
      const criterias = 'DATA_PLACEHOLDER';

      /**
       * Transform timestamp of infologger into javascript Date object
       * @param {number} timestamp
       * @return {Date}
       */
      function parseInfoLoggerDate(timestamp) {
        return new Date(timestamp * 1000);
      }

      /**
       * Method to generate criteria value as Regex
       * @param {string} criteria Criteria passed in by user
       * @return {RegExp}
       */
      function generateRegexCriteriaValue(criteria) {
        criteria = criteria.replace(new RegExp('%', 'g'), '.*');
        criteria = criteria.replace(new RegExp('_', 'g'), '.');
        return new RegExp('^' + criteria + '$');
      }

      /**
       * Method to replace all new lines from a log value
       * @param {string} logValue
       * @return {string}
       */
      function removeNewLinesFrom(logValue) {
        if (typeof logValue !== 'string') {
          return logValue;
        }
        return logValue.replace(/\r?\n|\r/g, '');
      }

      // eslint-disable-next-line guard-for-in
      for (const field in criterias) {
        const logValue = log[field];

        // eslint-disable-next-line guard-for-in
        for (const operator in criterias[field]) {
          let criteriaValue = criterias[field][operator];
          // don't apply criterias not set
          if (criteriaValue === null) {
            continue;
          }

          // logValue is sometime required, undefined means test fails and log is rejected
          switch (operator) {
            case '$in':
              if (logValue === undefined || !criteriaValue.includes(logValue)) {
                return false;
              }
              break;
            case '$match': {
              const criteriaList = criteriaValue.split(' ');
              if (field !== 'message' && criteriaList.length > 1) {
                criteriaValue = criteriaValue.replace(new RegExp(' ', 'g'), '|');
              }
              if (logValue === undefined ||
                !generateRegexCriteriaValue(criteriaValue).test(removeNewLinesFrom(logValue))) {
                return false;
              }
              break;
            }
            case '$exclude': {
              const criteriaList = criteriaValue.split(' ');
              if (field !== 'message' && criteriaList.length > 1) {
                criteriaValue = criteriaValue.replace(new RegExp(' ', 'g'), '|');
              }
              if (logValue !== undefined &&
                generateRegexCriteriaValue(criteriaValue).test(removeNewLinesFrom(logValue))) {
                return false;
              }
              break;
            }
            case '$since':
              if (logValue === undefined || parseInfoLoggerDate(logValue) < parseInfoLoggerDate(criteriaValue)) {
                return false;
              }
              break;

            case '$until':
              if (logValue === undefined || parseInfoLoggerDate(logValue) > parseInfoLoggerDate(criteriaValue)) {
                return false;
              }
              break;

            case '$min':
              if (logValue === undefined || parseInt(logValue, 10) < parseInt(criteriaValue, 10)) {
                return false;
              }
              break;

            case '$max':
              if (logValue === undefined || parseInt(logValue, 10) > parseInt(criteriaValue, 10)) {
                return false;
              }
              break;
            default:
              continue;
          }
        }
      }
      return true;
    }

    const criteriasJSON = JSON.stringify(this.criterias);
    const functionAsString = filterFunction.toString();
    const functionWithCriterias = functionAsString.replace('\'DATA_PLACEHOLDER\'', criteriasJSON);
    const functionPure = eval(`(${functionWithCriterias})`);
    return functionPure;
  }

  /**
   * Reset all filters from the current LogFilter instance to there
   * original state: empty or exclusive for other criterias.
   */
  resetCriteria() {
    this.criterias = {
      timestamp: {
        since: '',
        until: '',
        $since: null,
        $until: null,
      },
      hostname: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null,
      },
      rolename: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      pid: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      username: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      system: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      facility: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      detector: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      partition: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      run: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      errcode: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      errline: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      errsource: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      message: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
      },
      severity: {
        in: 'I W E F',
        $in: ['W', 'I', 'E', 'F'],
      },
      level: {
        max: null, // 0, 1, 6, 11, 21
        $max: null, // 0, 1, 6, 11, 21
      },
    };
    this.notify();
  }
}
