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
   * @param {Promise} promise - promise that is to be watched
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
   * @param {boolean} originalMessage - true if the client expects the raw formatted message in case of error
   * @return {AjaxResult} result, ok, status
   * @see {@link AjaxResult}
   * @example
   * import {Loader} from '/js/src/index.js';
   * const loader = new Loader();
   * const {result, ok} = await loader.post('/api/foo', {bar: 123, baz: 456})
   */
  async post(url, body, originalMessage) {
    body = body || {};

    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };

    return await this._request(url, options, originalMessage);
  }

  /**
   * Do a GET request with `query` as query content.
   * @param {string} url - any URL part
   * @param {object} query - content
   * @param {boolean} originalMessage - true if the client expects the raw formatted message in case of error
   * @return {AjaxResult} result, ok, status
   * @see {@link AjaxResult}
   * @example
   * import {Loader} from '/js/src/index.js';
   * const loader = new Loader();
   * const {result, ok} = await loader.get('/api/foo', {bar: 123, baz: 456})
   */
  async get(url, query, originalMessage) {
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

    return await this._request(url, options, originalMessage);
  }

  /**
   * Wrapper around fetchClient to watch how many requests are established,
   * handle errors and parse json content
   * @param {string} url - any URL part
   * @param {object} options - options passed to native fetch API
   * @param {boolean} originalMessage - true if the client expects the raw formatted message in case of error
   * @return {AjaxResult} result, ok, status
   */
  async _request(url, options, originalMessage = false) {
    const request = fetchClient(url, options);
    this.watchPromise(request);

    let response;
    try {
      response = await request;
    } catch {
      // Handle connection error
      const message = 'Connection to server failed, please try again';
      return new AjaxResult(false, 0, { message });
    }

    // Handle server error-
    if (!response.ok) {
      let upstreamMessage = {};
      try {
        upstreamMessage = await response.json();
      } catch {
        upstreamMessage.message = 'Server provided no deatils';
      }

      const message = originalMessage ? upstreamMessage.message :
        `Request to server failed (${response.status} ${response.statusText}): ${upstreamMessage.message}`;
      return new AjaxResult(false, response.status, { message });
    }

    let result;
    try {
      result = await response.json();
    } catch {
      // Handle JSON error
      const message = 'Parsing result from server failed';
      return new AjaxResult(false, response.status, { message });
    }

    // OK!
    return new AjaxResult(response.ok, response.status, result);
  }
}

export default Loader;
