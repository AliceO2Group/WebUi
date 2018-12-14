import Observable from './Observable.js';
import fetchClient from './fetchClient.js';

/**
 * DTO representing result of an Ajax call
 * Used as output of Loader calls
 * @see {@link Loader}
 */
class AjaxResult {
  /**
   * Constructor
   * @param {boolean} ok - status code between 200 and 299
   * @param {number} status - 200, 404, etc. 0 if connection failed
   * @param {object} result - object from server
   */
  constructor(ok, status, result) {
    this.ok = ok;
    this.status = status;
    this.result = result;
  }
}

/**
 * Network loader, count current requests, handle errors, make ajax requests
 * @extends Observable
 */
class Loader extends Observable {
  /**
   * Initialize `activePromises` to 0
   * @property {boolean} active
   * @property {number} activePromises
   */
  constructor() {
    super();

    this.active = false;
    this.activePromises = 0;
  }

  /**
   * Register a promise and increase `activePromises` by 1,
   * on promise ends, decrease by 1.
   * @param {Promise} promise
   */
  watchPromise(promise) {
    this.activePromises++;
    this.active = true;
    promise
      .then(this._promiseSuccess.bind(this))
      .catch(this._promiseError.bind(this));
  }

  /**
   * Private method. increase `activePromises` by 1
   * @param {Any} data - passthough
   * @return {Any} data
   */
  _promiseSuccess(data) {
    this.activePromises--;
    this.active = this.activePromises > 0;
    return data;
  }

  /**
   * Private method. decrease `activePromises` by 1
   * @param {Any} err - passthough
   * @throw {Any} err
   */
  _promiseError(err) {
    this.activePromises--;
    this.active = this.activePromises > 0;
    throw err;
  }

  /**
   * Do a POST request with `body` as JSON content.
   * @param {string} url - any URL part
   * @param {object} body - content
   * @return {AjaxResult} result, ok, status
   * @see {@link AjaxResult}
   * @example
   * import {Loader} from '/js/src/index.js';
   * const loader = new Loader();
   * const {result, ok} = await loader.post('/api/foo', {bar: 123, baz: 456})
   */
  async post(url, body) {
    body = body || {};

    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    return await this._request(url, options);
  }

  /**
   * Do a GET request with `query` as query content.
   * @param {string} url - any URL part
   * @param {object} query - content
   * @return {AjaxResult} result, ok, status
   * @see {@link AjaxResult}
   * @example
   * import {Loader} from '/js/src/index.js';
   * const loader = new Loader();
   * const {result, ok} = await loader.get('/api/foo', {bar: 123, baz: 456})
   */
  async get(url, query) {
    url = new URL(url, window.location);
    if (query) {
      Object.keys(query).forEach((key) => url.searchParams.append(key, query[key]));
    }

    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };

    return await this._request(url, options);
  }

  /**
   * Wrapper around fetchClient to watch how many requests are established,
   * handle errors and parse json content
   * @param {string} url - any URL part
   * @param {object} options - options passed to native fetch API
   * @return {AjaxResult} result, ok, status
   */
  async _request(url, options) {
    const request = fetchClient(url, options);
    this.watchPromise(request);

    let response;
    try {
      response = await request;
    } catch (error) {
      // handle connection error
      const message = `Connection to server failed, please try again`;
      return new AjaxResult(false, 0, {message});
    }

    // handle server error-
    if (!response.ok) {
      let upstreamMessage = {};
      try {
        upstreamMessage = await response.json();
      } catch (e) {
        upstreamMessage.message = 'Server provided no deatils';
      }

      // eslint-disable-next-line
      const message = `Request to server failed (${response.status} ${response.statusText}): ${upstreamMessage.message}`;
      return new AjaxResult(false, response.status, {message});
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      // handle JSON error
      const message = `Parsing result from server failed`;
      return new AjaxResult(false, response.status, {message});
    }

    // OK!
    return new AjaxResult(response.ok, response.status, result);
  }
}

export default Loader;
