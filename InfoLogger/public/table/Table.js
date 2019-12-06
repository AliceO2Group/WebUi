import {Observable, RemoteData} from '/js/src/index.js';
import LogFilter from '../logFilter/LogFilter.js';
import {MODE} from '../constants/mode.const.js';
import {TIME_MS} from '../common/Timezone.js';

/**
 * Model Table, encapsulate all changes of the table based on the user profile
 */
export default class Table extends Observable {
  /**
   * Instantiate Log class and its internal LogFilter
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.colsHeader = this.resetColumnsHeaderToDefault();
  }

  /**
   * Method to reset what columns are displayed and their sizes
   * @return {JSON}
   */
  resetColumnsHeaderToDefault() {
    return {
      date: {
        size: 'col-m',
        visible: false
      },
      time: {
        size: 'col-m',
        visible: true,
      },
      hostname: {
        size: 'col-m',
        visible: false,
      },
      rolename: {
        size: 'col-m',
        visible: true,
      },
      pid: {
        size: 'col-s',
        visible: false,
      },
      username: {
        size: 'col-m',
        visible: false,
      },
      system: {
        size: 'col-s',
        visible: true,
      },
      facility: {
        size: 'col-m',
        visible: false,
      },
      detector: {
        size: 'col-s',
        visible: false,
      },
      partition: {
        size: 'col-m',
        visible: false,
      },
      run: {
        size: 'col-s',
        visible: false,
      },
      errcode: {
        size: 'col-s',
        visible: false,
      },
      errline: {
        size: 'col-s',
        visible: false,
      },
      errsource: {
        size: 'col-m',
        visible: false,
      },
      message: {
        size: '', // remaining
        visible: false,
      }
    };
  }
}
