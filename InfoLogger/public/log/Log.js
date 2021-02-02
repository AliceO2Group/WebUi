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

import {Observable, RemoteData} from '/js/src/index.js';
import LogFilter from '../logFilter/LogFilter.js';
import {MODE} from '../constants/mode.const.js';
import {TIME_MS} from '../common/Timezone.js';

/**
 * Model Log, encapsulate all log management and queries
 */
export default class Log extends Observable {
  /**
   * Instantiate Log class and its internal LogFilter
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.filter = new LogFilter(model);
    this.filter.bubbleTo(this);

    this.focus = { // show date picker on focus
      timestampSince: false,
      timestampUntil: false,
    };

    this.isTimeDropdownEnabled = false;
    this.timeFormat = TIME_MS;

    this.limit = 1000;
    this.applicationLimit = 100000; // browser can be slow is `list` array is bigger

    this.queryResult = RemoteData.notAsked();


    this.list = [];
    this.item = null;
    this.autoScrollToItem = false; // go to an item
    this.autoScrollLive = false; // go at bottom on Live mode
    this.activeMode = MODE.QUERY;
    this.liveStartedAt = null;
    this.liveInterval = null; // 1s interval to update chrono
    this.resetStats();

    this.scrollTop = 0; // position of table scrollbar
    this.scrollHeight = 0; // height of content viewed in the scroll table

    this.statusDropdown = false;
  }

  /**
   * Method to return if the current mode is Query
   * @return {boolean}
   */
  isActiveModeQuery() {
    return this.activeMode === MODE.QUERY;
  }

  /**
   * Toggle a dropdown with the full SQL query
   */
  toggleStatusDropdown() {
    this.statusDropdown = !this.statusDropdown;
    this.notify();
  }

  /**
   * Set all stats severities to 0
   */
  resetStats() {
    this.stats = {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      fatal: 0
    };
  }

  /**
   * Increments stats of the severity of the log passed
   * @param {Log} log
   */
  addStats(log) {
    switch (log.severity) {
      case 'F':
        this.stats.fatal++;
        break;
      case 'E':
        this.stats.error++;
        break;
      case 'W':
        this.stats.warning++;
        break;
      case 'I':
        this.stats.info++;
        break;
      case 'D':
        this.stats.debug++;
    }
  }


  /**
   * Show/Hide dropdown for time(s/ms) selection
   */
  toggleTimeFormat() {
    this.isTimeDropdownEnabled = !this.isTimeDropdownEnabled;
    this.notify();
  }

  /**
   * Used to display of not timestamp input panel
   * @param {string} property
   * @param {boolean} value
   */
  setFocus(property, value) {
    this.focus[property] = value;
    this.notify();
  }

  /**
   * Set "level" filter (shift, oncall, etc.)
   * @param {number} level
   */
  setLevel(level) {
    this.level = level;
    this.notify();
  }

  /**
   * Set current `item`, if the reference is contained
   * in `list`, it is also considered as selected in the list.
   * @param {object} item
   */
  setItem(item) {
    this.item = item;
    this.autoScrollToItem = false;
    this.notify();
  }

  /**
   * Set "limit" filter (1k, 10k, 100k)
   * @param {number} limit
   */
  setLimit(limit) {
    this.limit = limit;
    this.notify();
  }

  /**
   * Set `item` as first row in the `list` to have an error/fatal
   * if no error, do nothing.
   */
  firstError() {
    if (!this.stats.error && !this.stats.fatal) {
      this.model.notification.show(`No error or fatal found.`, 'primary');
      return;
    }

    this.item = this.list.find((item) => item.severity === 'E' || item.severity === 'F');
    this.autoScrollToItem = true;
    this.notify();
  }

  /**
   * Find previous `item` in `list` to have an error/fatal
   * starting from current `item`.
   * if no current `item`, find last error/fatal.
   * if no error, do nothing.
   */
  previousError() {
    if (!this.stats.error && !this.stats.fatal) {
      this.model.notification.show(`No error or fatal found.`, 'primary');
      return;
    }

    if (!this.item) {
      this.lastError();
      return;
    }

    const currentIndex = this.list.indexOf(this.item);
    // find previous one, if any
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (this.list[i].severity === 'E' || this.list[i].severity === 'F') {
        this.item = this.list[i];
        this.autoScrollToItem = true;
        this.notify();
        break;
      }
    }
  }

  /**
   * Find next `item` in `list` to have an error/fatal
   * starting from current `item`.
   * if no current `item`, find first error/fatal.
   * if no error, do nothing.
   */
  nextError() {
    if (!this.stats.error && !this.stats.fatal) {
      this.model.notification.show(`No error or fatal found.`, 'primary');
      return;
    }

    if (!this.item) {
      this.firstError();
      return;
    }

    const currentIndex = this.list.indexOf(this.item);
    // find next one, if any
    for (let i = currentIndex + 1; i < this.list.length; i++) {
      if (this.list[i].severity === 'E' || this.list[i].severity === 'F') {
        this.item = this.list[i];
        this.autoScrollToItem = true;
        this.notify();
        break;
      }
    }
  }

  /**
   * Set `item` as first row in the `list` to have an error/fatal
   * if no error, do nothing.
   */
  lastError() {
    if (!this.stats.error && !this.stats.fatal) {
      this.model.notification.show(`No error or fatal found.`, 'primary');
      return;
    }

    for (let i = this.list.length - 1; i >= 0; --i) {
      const item = this.list[i];
      if (item.severity === 'E' || item.severity === 'F') {
        this.item = item;
        break;
      }
    }

    this.autoScrollToItem = true;
    this.notify();
  }

  /**
   * Select previous `item` after current `item` or first of `list`
   */
  previousItem() {
    this.goToItem(Math.max(this.list.indexOf(this.item) - 1, 0));
  }

  /**
   * Select next `item` after current `item` or first of `list`
   */
  nextItem() {
    this.goToItem(Math.min(this.list.indexOf(this.item) + 1, this.list.length - 1));
  }

  /**
 * Select last `item` from the `list`
 */
  goToLastItem() {
    this.goToItem(this.list.length - 1);
  }

  /**
   * Go to the `item` in the `list` with the corresponding index
   * @param {Number} index
   */
  goToItem(index) {
    if (!this.list.length || index >= this.list.length) {
      return;
    }

    this.item = this.list[index];
    this.autoScrollToItem = true;
    this.notify();
  }

  /**
   * Query database according to filters.
   * Only is service is available and configured on server side.
   * If live mode is enabled, it is turned off.
   * `list` is then reset and filled with result.
   */
  async query() {
    if (!this.model.servicesResult.isSuccess() || !this.model.servicesResult.payload.query) {
      throw new Error('Query service is not available');
    }
    this.queryResult = RemoteData.loading();
    this.notify();

    if (this.isLiveModeRunning()) {
      this.liveStop(MODE.QUERY);
    } else {
      this.activeMode = MODE.QUERY;
    }

    const queryArguments = {
      criterias: this.filter.criterias,
      options: {limit: this.limit}
    };
    const {result, ok} = await this.model.loader.post(`/api/query`, queryArguments);
    if (!ok) {
      this.model.notification.show(`Server error, unable to query logs`, 'danger');
      this.queryResult = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.queryResult = RemoteData.success(result);
    this.list = result.rows;

    this.resetStats();
    result.rows.forEach(this.addStats.bind(this));
    this.goToLastItem();
    this.notify();
  }

  /**
   * Forward call to `this.filter.setCriteria`. If live mode is enabled,
   * alert user that filtering will be affected.
   * See LogFilter#setCriteria doc
   * @param {string} field
   * @param {string} operator
   * @param {string} value
   */
  setCriteria(field, operator, value) {
    if (operator === 'in' && this.filter.criterias.severity.$in) {
      const copy = this.filter.criterias.severity.$in.concat();
      const index = copy.indexOf(value);
      if (index === -1) {
        copy.push(value);
      } else {
        copy.splice(index, 1);
      }
      value = copy.join(' ');
    }
    if (this.filter.setCriteria(field, operator, value)) {
      if (this.isLiveModeRunning()) {
        this.model.ws.setFilter(this.model.log.filter.toFunction());
        this.model.notification.show(
          `The current live session has been adapted to the new filter configuration.`, 'primary', 2000);
      } else if (this.isActiveModeQuery()) {
        this.model.notification.show(`Filters have changed. Query again for updated results`, 'primary', 2000);
      }
    }
  }

  /**
   * Starts a live mode session by sending filters to server to allow streaming.
   * Clears also log list.
   */
  liveStart() {
    // those Errors should be protected by user interface
    if (this.queryResult.isLoading()) {
      throw new Error('Query is loading, wait before starting live');
    }
    if (!this.model.ws.authed) {
      throw new Error('WS is not yet ready');
    }
    if (!this.model.servicesResult.isSuccess() || !this.model.servicesResult.payload.live) {
      throw new Error(`Live service is not available due to: ${this.model.servicesResult.payload}`);
    }
    if (this.isLiveModeRunning()) {
      throw new Error('Live already enabled');
    }

    this.list = [];
    this.resetStats();
    this.queryResult = RemoteData.notAsked(); // empty all data from last query
    this.activeMode = MODE.LIVE.RUNNING;
    this.liveStartedAt = new Date();

    // Notify this model each second to force chorno to be updated
    // because the output of formatDuration() change in time
    // kill this interval when live mode is off
    this.liveInterval = setInterval(this.notify.bind(this), 1000);

    this.model.ws.setFilter(this.model.log.filter.toFunction());

    this.notify();
  }

  /**
   * Stops live mode and moves to specified mode ('Paused' or 'Query')
   * @param {MODE} mode to switch to (default 'Query')
   */
  liveStop(mode = MODE.QUERY) {
    if (mode !== MODE.QUERY && mode !== MODE.LIVE.PAUSED) {
      mode = MODE.QUERY;
    }
    this.activeMode = mode;
    clearInterval(this.liveInterval);
    this.model.ws.setFilter(() => false);
    this.notify();
  }

  /**
   * Method to check if current mode is Live (Running/Paused)
   * @return {boolean} is it live mode
   */
  isLiveModeEnabled() {
    return this.activeMode === MODE.LIVE.RUNNING || this.activeMode === MODE.LIVE.PAUSED;
  }

  /**
   * Method to check if current selected mode is live and is running
   * @return {boolean} is live mode running
   */
  isLiveModeRunning() {
    return this.activeMode === MODE.LIVE.RUNNING;
  }

  /**
   * Set log's table UI sizes to allow log scrolling
   * @param {number} scrollTop - position of the user's scroll cursor
   * @param {number} scrollHeight - height of table's viewport (not content height which is higher)
   */
  setScrollTop(scrollTop, scrollHeight) {
    this.scrollTop = scrollTop;
    this.scrollHeight = scrollHeight;
    this.notify();
  }

  /**
   * Empty the list of all logs, reset stats and clear query mode request if any.
   */
  empty() {
    this.list = [];
    this.resetStats();
    this.queryResult = RemoteData.notAsked();
    this.notify();
  }

  /**
   * Add a log to the list to be shown on screen
   * Keep only `limit` logs
   * @param {object} log
   */
  addLog(log) {
    this.addStats(log);
    this.list.push(log);
    if (this.list.length > this.limit) {
      this.list.splice(0, this.list.length - this.limit);
    }
    this.notify();
  }

  /**
   * Enable or disable auto-scroll for live mode, a checkbox is used to control it
   */
  toggleAutoScroll() {
    this.autoScrollLive = !this.autoScrollLive;
    this.notify();
  }

  /**
   * Method to update the state of the selected mode
   * @param {MODE} mode that will be enabled
   */
  updateLogMode(mode) {
    switch (mode) {
      case MODE.LIVE.RUNNING:
        this.liveStart();
        break;
      case MODE.LIVE.PAUSED:
        this.liveStop(mode);
        break;
      default:
        this.query();
    }
  }

  /**
   * Method which will create a table alike string with the elements displayed in the table of the current item
   * @return {string}
   */
  displayedItemFieldsToString() {
    let message = '| ' + this.item['severity'];
    Object.keys(this.model.table.colsHeader)
      .filter((key) => this.model.table.colsHeader[key].visible)
      .forEach((key) => {
        const item = this.item[key];
        if (key === 'time') {
          const timestamp = this.item['timestamp'];
          message += ' | ' + this.model.timezone.format(timestamp, this.timeFormat);
        } else if (key === 'date') {
          const timestamp = this.item['timestamp'];
          message += ' | ' + this.model.timezone.format(timestamp, 'date');
        } else if (item) {
          message += ' | ' + item;
        } else {
          message += ' | ';
        }
      });
    message += ' |';
    return message;
  }
}
