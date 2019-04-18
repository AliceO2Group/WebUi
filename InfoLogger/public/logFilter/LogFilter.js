import {Observable} from '/js/src/index.js';

/**
 * @typedef Criteria
 * @type {object}
 * @property {object} field - field name like pid, username, timestamp
 * @property {string} field.operator - $match, $exclude, $since, $until, $min, $max, $in
 */

/**
 * @typedef Criterias
 * @type {Array.<Criteria>}
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
   * Instantiate a LogFilter with criterias reset to empty or minimal value
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.resetCriterias();
  }

  /**
   * Set a filter criteria for a field with an operator and value.
   * For each field+operator a parsed property in criterias is made with associated cast (Date, number, Array).
   * @param {string} field
   * @param {string} operator
   * @param {string} value
   * @example
   * setCriteria('severity', 'in', 'W E F')
   * // severity is W or E or F
   * //
   */
  setCriteria(field, operator, value) {
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
    this.resetCriterias();
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

      // eslint-disable-next-line guard-for-in
      for (const field in criterias) {
        const logValue = log[field];

        // eslint-disable-next-line guard-for-in
        for (const operator in criterias[field]) {
          const criteriaValue = criterias[field][operator];

          // don't apply criterias not set
          if (criteriaValue === null) {
            continue;
          }

          // logValue is sometime required, undefined means test fails and log is rejected
          switch (operator) {
            case '$match':
            case '$in':
              if (logValue === undefined || criteriaValue.indexOf(logValue) === -1) {
                return false;
              }
              break;

            case '$exclude':
              if (logValue !== undefined && criteriaValue.indexOf(logValue) >= 0) {
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
  resetCriterias() {
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
        max: 1, // 0, 1, 6, 11, 21
        $max: 1, // 0, 1, 6, 11, 21
      },
    };
    this.notify();
  }
}
