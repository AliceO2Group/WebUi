import {Observable} from '/js/src/index.js';

export default class LogFilter extends Observable {
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
   * @param {Any} value
   * @example
   * setCriteria('severity', 'match', 'W E F')
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
        this.criterias[field]['$match'] = value ? value.split(' ') : null;
        break;
      case 'exclude':
        this.criterias[field]['$exclude'] = value ? value.split(' ') : null;
        break;
      default:
        throw new Error('unkown operator');
        break;
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
    for (let field in criterias) {
      for (let operator in criterias[field]) {
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

  fromObject(criterias) {
    this.resetCriterias();

    // copy values to inner filters
    for (let field in criterias) {
      for (let operator in criterias[field]) {
        this.setCriteria(field, operator, criterias[field][operator]);
      }
    }

    this.notify();
  }

  /**
   * Generates a function to filter a log passed as argument to it
   * Output of function is boolean.
   * @return {Function(WebSocketMessage.<{log}>).<boolean>}
   */
  toFunction() {
    const criterias = this.criterias;

    // This function will be stringified then sent to server so it can filter logs
    // 'DATA_PLACEHOLDER' will be replaced by the stringified filters too so the function contains de data
    function filterFunction(message) {
      const log = message.payload;
      const criterias = 'DATA_PLACEHOLDER';

      for (const field in criterias) {
        let logValue = log[field];

        for (const operator in criterias[field]) {
          let criteriaValue = criterias[field][operator];

          // don't apply criterias not set
          if (criteriaValue === null) {
            continue;
          }

          // logValue is sometime required, undefined means test fails and log is rejected
          switch(operator) {
            case '$match':
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
              if (logValue === undefined || parseIlDate(logValue) < parseIlDate(criteriaValue)) {
                return false;
              }
              break;

            case '$until':
              if (logValue === undefined || parseIlDate(logValue) > parseIlDate(criteriaValue)) {
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
              break;
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
      hostname: {
        match: '',
        exclude: '',
        $match: null,
        $exclude: null
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
        match: '',
        $match: null,
      },
      level: {
        max: 1, // 0, 1, 6, 11, 21
        $max: 1, // 0, 1, 6, 11, 21
      },
    };
    this.notify();
  }
}

/**
 * Transform timestamp of infologger into js Date
 * @param {number} timestamp
 * @return {Date}
 */
function parseIlDate(timestamp) {
  return new Date(timestamp * 1000);
}
