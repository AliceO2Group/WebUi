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

import { Observable } from '/js/src/index.js';
import { TEXT_FILTER_OPERATORS } from '../constants/text-filter-operators.const.js';
import { getDisabledSeverities } from '../constants/log-level-filters.const.js';

/**
 * @typedef Criteria
 * @type {object}
 * @property {object} field - field name like pid, username, timestamp
 * @property {string} field.operator - $match, $exclude, $since, $until, $min, $max, $in
 */

/**
 * @typedef {Array.<Criteria>} Criteria
 */

/**
 * This makes a criteria object with all properties initialized to empty or minimal value
 * @returns {object} criteria object with all properties initialized
 */
const makeDefaultMatchExcludeOperators = () => ({
  match: '',
  exclude: '',
  $match: null,
  $exclude: null,
  matchEmpty: false,
  $matchEmpty: false,
  excludeEmpty: false,
  $excludeEmpty: false,
});

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
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;

    this.resetCriteria();
  }

  /**
   * Set a filter criteria to a field with an operator and value only if the new value is different than the current.
   * For each field+operator a parsed property in criterias is made with associated cast (Date, number, Array).
   * @param {string} field - field name like pid, username, timestamp
   * @param {string} operator - $match, $exclude, $since, $until, $min, $max, $in
   * @param {string} value - value to be set
   * @returns {boolean} - true if value was set, false if value was the same as before
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
        case 'matchEmpty':
          this.criterias[field]['$matchEmpty'] = Boolean(value);
          break;
        case 'excludeEmpty':
          this.criterias[field]['$excludeEmpty'] = Boolean(value);
          break;
        default:
          throw new Error('unknown operator');
      }

      // enforces on both severity and level as fromObject can set them in either order
      if (field === 'severity' || field === 'level') {
        this.enforceDisabledSeverities();
      }

      // Ensure that both matchEmpty and excludeEmpty are not active at the same time
      if (value && (operator === 'matchEmpty' || operator === 'excludeEmpty')) {
        const oppositeKey = operator === 'matchEmpty' ? 'excludeEmpty' : 'matchEmpty';
        if (this.criterias[field][oppositeKey]) {
          this.criterias[field][oppositeKey] = false;
          this.criterias[field][`$${oppositeKey}`] = false;
        }
      }

      this.notify();
      return true;
    } else {
      return false;
    }
  }

  /**
   * Exports all filled filters inputs
   * @returns {object} minimal filter object
   */
  toObject() {
    // copy everything
    const criterias = JSON.parse(JSON.stringify(this.criterias));

    // clean-up the whole structure

    for (const field in criterias) {
      for (const operator in criterias[field]) {
        // remote parsed properties (generated with fromJSON)
        if (operator.includes('$')) {
          delete criterias[field][operator];
        }

        // remote empty inputs
        if (!criterias[field][operator]) {
          delete criterias[field][operator];
        } else if (operator === 'match' || operator === 'exclude') {
          // encode potential breaking characters and escape double quotes as are used by browser by default
          criterias[field][operator] = encodeURI(criterias[field][operator].replace(/["]+/g, '\\"'));
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
   * @param {object} criterias - object with criterias to be set
   */
  fromObject(criterias) {
    this.resetCriteria();
    Object.keys(criterias).forEach((field) => {
      Object.keys(criterias[field])
        .filter((operator) => criterias[field][operator])
        .forEach((operator) => this.setCriteria(field, operator, criterias[field][operator]));
    });
    this.notify();
  }

  /**
   * Check whether at least one text filter is set by the user.
   * Only text filters use the since/until and match/exclude fields.
   * @returns {boolean} true if at least one text filter has a value
   */
  hasActiveTextFilters() {
    return Object.values(this.criterias).some((criteria) =>
      TEXT_FILTER_OPERATORS.some((operator) => criteria[operator]?.trim()));
  }

  /**
   * Check whether a severity is disabled for the current log level.
   * @param {string} severityCode - [D, I, W, E, F]
   * @returns {boolean} true if the severity is not allowed at the current level
   */
  isSeverityDisabled(severityCode) {
    return getDisabledSeverities(this.criterias.level.max).includes(severityCode);
  }

  /**
   * Remove any active severity selections that are disallowed by the current level.
   */
  enforceDisabledSeverities() {
    const disabled = getDisabledSeverities(this.criterias.level.max);
    const current = this.criterias.severity.$in;
    if (disabled.length === 0 || !current) {
      return;
    }

    const filteredSeverities = current.filter((s) => !disabled.includes(s));
    // Only update if there is a change
    if (filteredSeverities.length !== current.length) {
      this.criterias.severity.$in = filteredSeverities;
      this.criterias.severity.in = filteredSeverities.join(' ');
    }
  }

  /**
   * Generates a function to filter a log passed as argument to it
   * Output of function is boolean.
   * @returns {(message: WebSocketMessage) => boolean} - function to filter logs
   */
  toStringifyFunction() {
    /**
     * This function will be stringified then sent to server so it can filter logs
     * 'DATA_PLACEHOLDER' will be replaced by the stringified filters too so the function contains de data
     * @param {WebSocketMessage} message - message to be filtered
     * @returns {boolean} true if message passes criterias
     */
    function filterFunction(message) {
      const log = message.payload;
      const criterias = 'DATA_PLACEHOLDER';

      /**
       * Transform timestamp of infologger into javascript Date object
       * @param {number} timestamp - timestamp from infologger
       * @returns {Date} - javascript Date object
       */
      function parseInfoLoggerDate(timestamp) {
        return new Date(timestamp * 1000);
      }

      /**
       * Method to generate criteria value as Regex
       * @param {string} criteria Criteria passed in by user
       * @returns {RegExp} - regex criteria value
       */
      function generateRegexCriteriaValue(criteria) {
        criteria = criteria.replace(new RegExp('%', 'g'), '.*');
        criteria = criteria.replace(new RegExp('_', 'g'), '.');
        return new RegExp(`^${criteria}$`);
      }

      /**
       * Method to replace all new lines from a log value
       * @param {string} logValue - value of the log field that is to be checked (e.g. message, severity, etc.)
       * @returns {string} - log value without new lines
       */
      function removeNewLinesFrom(logValue) {
        if (typeof logValue !== 'string') {
          return logValue;
        }
        return logValue.replace(/\r?\n|\r/g, '');
      }

      /**
       * Whether a log field value is considered empty for matchEmpty/excludeEmpty purposes.
       * @param {string|number|undefined|null} logValue - value of the log field
       * @returns {boolean} - true if the value is undefined, null, or an empty string
       */
      function isEmpty(logValue) {
        return logValue === undefined || logValue === null || logValue === '';
      }

      /**
       * Function that applies the criteria of one filter set by the user on each received logValue
       * @param {object} logValue - value of the log field that is to be checked (e.g. message, severity, etc.)
       * @param {object} criteria - object containing the criteria if applied by the user
       * @param {string} [separator = ' '] - (' ', 'n') to be applied when filtering based on an array of values;
       * @returns {boolean} - result of the log matching the filter set by user
       */
      function isLogMatchingMessageCriteria(logValue, criteria, separator = ' ') {
        for (const operator in criteria) {
          let criteriaValue = criteria[operator];
          // don't apply criterias not set
          if (criteriaValue === null || criteriaValue === false) {
            continue;
          }
          switch (operator) {
            case '$in': {
              if (logValue === undefined || !criteriaValue.includes(logValue)) {
                return false;
              }
              break;
            }
            case '$match': {
              if (isEmpty(logValue)) {
                if (!criteria.$matchEmpty) {
                  return false;
                }
                break;
              }
              const criteriaList = criteriaValue.split(separator);
              if (criteriaList.length > 1) {
                criteriaValue = criteriaValue.replace(new RegExp(separator, 'g'), '|');
              }
              if (!generateRegexCriteriaValue(criteriaValue).test(removeNewLinesFrom(logValue))) {
                return false;
              }
              break;
            }
            case '$exclude': {
              if (isEmpty(logValue) && criteria.$excludeEmpty) {
                return false;
              }
              const criteriaList = criteriaValue.split(separator);
              if (criteriaList.length > 1) {
                criteriaValue = criteriaValue.replace(new RegExp(separator, 'g'), '|');
              }
              if (logValue !== undefined &&
                generateRegexCriteriaValue(criteriaValue).test(removeNewLinesFrom(logValue))) {
                return false;
              }
              break;
            }
            case '$matchEmpty':
              if (!criteria.$match && !isEmpty(logValue)) {
                return false;
              }
              break;
            case '$excludeEmpty':
              if (!criteria.$exclude && isEmpty(logValue)) {
                return false;
              }
              break;
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
        return true;
      }

      /*
       * Removes the message from the initial filtering as this puts a lot of stress on the server
       * Filtering will be done initially on the small contained fields and only later if still needed on the message
       */
      const messageCriteria = criterias.message;
      delete criterias.message;

      for (const field in criterias) {
        if (isLogMatchingMessageCriteria(log[field], criterias[field], ' ')) {
          continue;
        } else {
          return false;
        }
      }
      return isLogMatchingMessageCriteria(log['message'], messageCriteria, '\n');
    }

    const criteriasJSON = JSON.stringify(this.criterias);
    const functionAsString = filterFunction.toString();
    const functionWithCriterias = functionAsString.replace('\'DATA_PLACEHOLDER\'', criteriasJSON);
    return functionWithCriterias;
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
        ...makeDefaultMatchExcludeOperators(),
      },
      rolename: {
        ...makeDefaultMatchExcludeOperators(),
      },
      pid: {
        ...makeDefaultMatchExcludeOperators(),
      },
      username: {
        ...makeDefaultMatchExcludeOperators(),
      },
      system: {
        ...makeDefaultMatchExcludeOperators(),
      },
      facility: {
        ...makeDefaultMatchExcludeOperators(),
      },
      detector: {
        ...makeDefaultMatchExcludeOperators(),
      },
      partition: {
        ...makeDefaultMatchExcludeOperators(),
      },
      run: {
        ...makeDefaultMatchExcludeOperators(),
      },
      errcode: {
        ...makeDefaultMatchExcludeOperators(),
      },
      errline: {
        ...makeDefaultMatchExcludeOperators(),
      },
      errsource: {
        ...makeDefaultMatchExcludeOperators(),
      },
      message: {
        ...makeDefaultMatchExcludeOperators(),
      },
      severity: {
        in: 'I W E F',
        $in: ['I', 'W', 'E', 'F'],
      },
      level: {
        max: 1,
        $max: 1,
      },
    };
    this.notify();
  }
}
