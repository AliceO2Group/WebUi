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

/* Global: window */

import Observable from './Observable.js';

/**
 * Router handle query history for Single Page Application (SPA)
 * It notifies when route change and it allows to push a new route.
 * Search parameters can be read directly via `params`, for example:
 * '?page=list' will give `.params ==== {page: 'list'}`.
 *
 * @property {object} params - Keys/values of search parameters
 * @extends Observable
 * @example
 * import {Observable, QueryRouter} from '/js/src/index.js';
 *
 * export default class Model extends Observable {
 *   constructor() {
 *     super();
 *
 *     // Setup router
 *     this.router = new QueryRouter();
 *     this.router.observe(this.handleLocationChange.bind(this));
 *     this.handleLocationChange(); // Init first page
 *   }
 *
 *   handleLocationChange() {
 *     switch (this.router.params.page) {
 *       case 'list':
 *         // call some ajax to load list
 *         break;
 *       case 'item':
 *         // call some ajax to load item this.router.params.id
 *         break;
 *       default:
 *         // default route, replace the current one not handled
 *         this.router.go('?page=list', true);
 *         break;
 *     }
 *   }
 * }
 *
 * import {h, switchCase} from '/js/src/index.js';
 *
 * export default (model) => h('div', [
 *   menu(model),
 *   content(model),
 * ]);
 *
 * const content = (model) => h('div', [
 *   switchCase(model.router.params.page, {
 *     list: () => h('p', 'print list'),
 *     item: () => h('p', `print item ${model.router.params.id}`),
 *   })()
 * ]);
 *
 * const menu = (model) => h('ul', [
 *   h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=list'}, 'List'),
 *   h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=1'}, 'Item 1'),
 *   h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=2'}, 'Item 2'),
 *   h('a', {onclick: (e) => model.router.handleLinkEvent(e), href: '?page=item&id=3'}, 'Item 3'),
 * ]);
 */
class QueryRouter extends Observable {
  /**
   * Constructor
   */
  constructor() {
    super();

    this.history = window.history;
    this.location = window.location;
    this.window = window;
    this.document = window.document;
    this.params = {};

    this._attachEvents();
  }

  /**
   * Listen to all history and location events and notify on change
   */
  _attachEvents() {
    const onLocationChange = this._handleLocationChange.bind(this);

    // On user goes backward in history
    this.window.addEventListener('popstate', onLocationChange, false);

    // On user goes forward in history
    this.window.addEventListener('pushstate', onLocationChange, false);

    // On page already loaded trigger the first state
    if (this.document.readyState === 'interactive' || this.document.readyState === 'complete') {
      this._handleLocationChange();
    } else {
      // ... or wait until page is loaded
      this.window.addEventListener('DOMContentLoaded', onLocationChange, false);
    }
  }

  /**
   * Notify observers that the location has changed
   */
  _handleLocationChange() {
    const url = new URL(this.location);
    const entries = url.searchParams.entries();
    this.params = {};
    for (const pair of entries) {
      this.params[pair[0]] = pair[1];
    }
    this.notify();
  }

  /**
   * Handle internal SPA link clicks and new tab actions (CTRL + click on links).
   * @param {object} e - DOM event
   */
  handleLinkEvent(e) {
    // the element to which the handler is attached, not the one firing
    const target = e.currentTarget;

    // user asked download, new tab, new window
    const specialOpening = e.altKey || e.metaKey || e.ctrlKey || e.shiftKey;

    const forceNewTab = target.target === '_blank';
    const differentOrigin = target.origin !== window.location.origin;

    if (specialOpening || forceNewTab || differentOrigin) {
      // let the browser handle the event
      return;
    }

    // stop other listeners to handle the event bubbling in the DOM tree
    e.preventDefault();

    // push new url on the bar address
    this.history.pushState({}, '', target.href);

    this._handleLocationChange();
  }

  /**
   * Get the current URL object containing searchParams, pathname, etc.
   * @return {URL}
   */
  getUrl() {
    return new URL(this.location);
  }

  /**
   * Go to the specified `uri`. If `replace` is set, the current history point is replaced.
   * @param {string} uri - e.g. ?foo=bar
   * @param {boolean} replace - true to replace history
   * @param {boolean} silent - change URL bar and history, but do not notify observers
   */
  go(uri, replace, silent) {
    const newURL = new URL(uri, this.location);

    if (replace) {
      this.history.replaceState({}, '', newURL);
    } else {
      this.history.pushState({}, '', newURL);
    }

    if (!silent) {
      // replaceState and pushState cannot be listen so we trigger manually that location changed
      this._handleLocationChange();
    }
  }
}

export default QueryRouter;
