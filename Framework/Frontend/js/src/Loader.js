import Observable from './Observable.js';
import fetchClient from './fetchClient.js';

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
   * @return {object} result, ok, status
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
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };

    const request = fetchClient(url, options);
    this.watchPromise(request);
    const response = await request;
    try {
      const result = await response.json();
      return {ok: response.ok, result: result, status: response.status};
    } catch (error) {
      // Usually JSON is wrong
      return {ok: false, result: {message: error.message}, status: response.status};
    }
  }

  /**
   * Do a GET request with `query` as query content.
   * @param {string} url - any URL part
   * @param {object} query - content
   * @return {object} result, ok, status
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
        'Accept': 'application/json',
      },
    };

    const request = fetchClient(url, options);
    this.watchPromise(request);
    const response = await request;
    try {
      const result = await response.json();
      return {ok: response.ok, result: result, status: response.status};
    } catch (error) {
      // Usually JSON is wrong
      return {ok: false, result: {message: error.message}, status: response.status};
    }
  }
}

export default Loader;
