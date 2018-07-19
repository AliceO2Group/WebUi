import {Observable, RemoteData} from '/js/src/index.js';
import LogFilter from '../logFilter/LogFilter.js';

export default class Log extends Observable {
  constructor(model) {
    super();

    this.model = model;

    this.filter = new LogFilter(model);
    this.filter.bubbleTo(this);

    this.columns = { // display or not
      date: false,
      time: true,
      hostname: false,
      rolename: true,
      pid: false,
      username: false,
      system: true,
      facility: false,
      detector: false,
      partition: false,
      run: false,
      errcode: true,
      errline: false,
      errsource: false,
      message: true
    };

    this.focus = { // show date picker on focus
      timestampSince: false,
      timestampUntil: false,
    };

    this.limit = 1000;
    this.applicationLimit = 100000; // browser can be slow is `list` array is bigger

    this.queryResult = RemoteData.NotAsked();

    this.list = [];
    this.item = null;
    this.autoScrollToItem = false; // go to an item
    this.autoScrollLive = false; // go at bottom on Live mode
    this.resetStats();

    this.scrollTop = 0; // position of table scrollbar
    this.scrollHeight = 0; // height of content viewed in the scroll table
  }

  resetStats() {
    this.stats = {
      info: 0,
      warning: 0,
      error: 0,
      fatal: 0,
    };
  }

  addStats(log) {
    switch(log.severity) {
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
    }
  }

  /**
   * Toggle column, displayed or hidden
   * @param {string} fieldName - field to be set
   */
  toggleColumn(fieldName) {
    this.columns[fieldName] = !this.columns[fieldName];
    this.notify();
  }

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
   * Set `item` as first row in the `list` to have an error
   * if no error, do nothing.
   */
  firstError() {
    if (!this.stats.error) {
      return;
    }

    this.item = this.list.find((item) => item.severity === 'E');
    this.autoScrollToItem = true;
    this.notify();
  }

  /**
   * Find previous `item` in `list` to have an error
   * starting from current `item`.
   * if no current `item`, find last error.
   * if no error, do nothing.
   */
  previousError() {
    if (!this.stats.error) {
      return;
    }

    if (!this.item) {
      this.lastError();
      return;
    }

    const currentIndex = this.list.indexOf(this.item);
    // find previous one, if any
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (this.list[i].severity === 'E') {
        this.item = this.list[i];
        this.autoScrollToItem = true;
        this.notify();
        break;
      }
    }
  }

  /**
   * Find next `item` in `list` to have an error
   * starting from current `item`.
   * if no current `item`, find first error.
   * if no error, do nothing.
   */
  nextError() {
    if (!this.stats.error) {
      return;
    }

    if (!this.item) {
      this.firstError();
      return;
    }

    const currentIndex = this.list.indexOf(this.item);
    // find next one, if any
    for (let i = currentIndex + 1; i < this.list.length; i++) {
      if (this.list[i].severity === 'E') {
        this.item = this.list[i];
        this.autoScrollToItem = true;
        this.notify();
        break;
      }
    }
  }

  /**
   * Set `item` as first row in the `list` to have an error
   * if no error, do nothing.
   */
  lastError() {
    if (!this.stats.error) {
      return;
    }

    for (let i = this.list.length - 1; i >= 0; --i) {
      const item = this.list[i];
      if (item.severity === 'E') {
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
    if (!this.list.length) {
      return;
    }

    this.item = this.list[Math.max(this.list.indexOf(this.item) - 1, 0)];
    this.autoScrollToItem = true;
    this.notify();
  }

  /**
   * Select next `item` after current `item` or first of `list`
   */
  nextItem() {
    if (!this.list.length) {
      return;
    }

    this.item = this.list[Math.min(this.list.indexOf(this.item) + 1, this.list.length - 1)];
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

    this.queryResult = RemoteData.Loading();
    this.notify();

    if (this.liveEnabled) {
      this.liveStop();
    }

    const queryArguments = {
      criterias: this.filter.criterias,
      options: {limit: this.limit}
    };
    const {result, ok} = await this.model.loader.post(`/api/query`, queryArguments);
    if (!ok) {
      this.queryResult = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.queryResult = RemoteData.Success(result);
    this.list = result.rows;
    this.resetStats();
    result.rows.forEach(this.addStats.bind(this));
    this.notify();
  }

  liveStart() {
    // those Errors should be protected by user interface
    if (this.queryResult.isLoading()) {
      throw new Error('Query is loading, wait before starting live');
    }
    if (!this.model.ws.authed) {
      throw new Error('WS is not yet ready');
    }
    if (!this.model.servicesResult.isSuccess() || !this.model.servicesResult.payload.live) {
      throw new Error('Live service is not available');
    }
    if (this.liveEnabled) {
      throw new Error('Live already enabled');
    }

    this.list = [];
    this.resetStats();
    this.queryResult = RemoteData.NotAsked(); // empty all data from last query
    this.liveEnabled = true;

    this.model.ws.setFilter(this.model.log.filter.toFunction());

    this.notify();
  }

  liveStop() {
    if (!this.liveEnabled) {
      throw new Error('Live not enabled');
    }

    this.liveEnabled = false;
    this.model.ws.setFilter(() => false);
    this.notify();
  }

  setScrollTop(scrollTop, scrollHeight) {
    this.scrollTop = scrollTop;
    this.scrollHeight = scrollHeight;
    this.notify();
  }

  empty() {
    this.list = [];
    this.resetStats();
    this.queryResult = RemoteData.NotAsked();
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

  toggleAutoScroll() {
    this.autoScrollLive = !this.autoScrollLive;
    this.notify();
  }
}
