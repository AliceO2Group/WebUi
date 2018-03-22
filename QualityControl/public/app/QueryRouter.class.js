/* Global: window, document */

import EventEmitter from './EventEmitter.class.js';
import {Observable} from '/js/src/index.js';

/*
Recall from NodeJS doc: https://nodejs.org/api/url.html
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            href                                             │
├──────────┬──┬─────────────────────┬─────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │        host         │           path            │ hash  │
│          │  │                     ├──────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │   hostname   │ port │ pathname │     search     │       │
│          │  │                     │              │      │          ├─┬──────────────┤       │
│          │  │                     │              │      │          │ │    query     │       │
"  https:   //    user   :   pass   @ sub.host.com : 8080   /p/a/t/h  ?  query=string   #hash "
│          │  │          │          │   hostname   │ port │          │                │       │
│          │  │          │          ├──────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │        host         │          │                │       │
├──────────┴──┼──────────┴──────────┼─────────────────────┤          │                │       │
│   origin    │                     │       origin        │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴─────────────────────┴──────────┴────────────────┴───────┤
│                                            href                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
*/

/**
 * Router handle query history for Single Page Application (SPA)
 * It notifies when route change and it allows to push a new route
 */
export default class QueryRouter extends Observable {
  /**
   * Constructor
   */
  constructor() {
    super();

    this.history = window.history;
    this.location = window.location;
    this.window = window;
    this.document = document;

    this._attachEvents();
  }

  /**
   * Listen to all history and location events and notify on change
   */
  _attachEvents() {
    // On user goes backward in history
    this.window.addEventListener('popstate', this._handleLocationChange.bind(this), false);

    // On user goes forward in history
    this.window.addEventListener('pushstate', this._handleLocationChange.bind(this), false);

    // On page already loaded trigger the first state
    if (this.document.readyState === 'interactive' || this.document.readyState === 'complete') {
      this._handleLocationChange();
    } else {
      // ... or wait until page is loaded
      this.window.addEventListener('DOMContentLoaded', this._handleLocationChange.bind(this), false);
    }
  }

  /**
   * Notify observers that the location has changed
   */
  _handleLocationChange() {
    this.notify();
  }

  /**
   * Handle internal SPA link clicks and new tab actions (CTRL + click on links).
   * @param {object} e - DOM event
   */
  handleLinkEvent(e) {
    const target = e.currentTarget; // the element to which the handler is attached, not the one firing
    const specialOpening = e.altKey || e.metaKey || e.ctrlKey || e.shiftKey; // user asked download, new tab, new window
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

  setSearch(search, replace) {
    const url = this.getUrl();
    url.search = search;

    if (replace) {
      this.history.replaceState({}, '', url);
    } else {
      this.history.pushState({}, '', url);
    }

    // replaceState and pushState cannot be listen so we trigger manually that location changed
    this._handleLocationChange();
  }
}
