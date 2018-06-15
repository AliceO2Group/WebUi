import {Observable, fetchClient} from '/js/src/index.js';

/**
 * Network loader, count current requests, handle errors, make ajax requests
 */
export default class Loader extends Observable {
  constructor(model) {
    super();

    this.model = model;
    this.active = false;
    this.activePromises = 0;
  }

  watchPromise(promise) {
    this.activePromises++;
    this.active = true;
    promise.then(this.promiseSuccess.bind(this))
           .catch(this.promiseError.bind(this));
    return promise;
  }

  promiseSuccess(data) {
    this.activePromises--;
    this.active = this.activePromises > 0;
    return data;
  }

  promiseError(err) {
    this.activePromises--;
    this.active = this.activePromises > 0;
    throw err;
  }

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
}
