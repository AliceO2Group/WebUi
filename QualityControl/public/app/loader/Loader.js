import {Observable} from '/js/src/index.js';

/**
 * Network loader, count current requests, handle errors
 * @param {string} argName - blabla
 * @return {string} blabla
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

  async intercept(req, opt = {}) {
    const options = Object.assign({}, opt, {
      watch: true
    });

    if (options.watch) {
      this.watchPromise(req);
    }

    const response = await req;

    if (response.ok) {
      const result = await response.json();
      return {response, result};
    }

    switch(response.status) {
      case 400:
        alert('Sorry, an unexpected behaviour happened with this request, you should ask support.');
        break;
      case 404:
        alert('Sorry, this item does not exist.');
        break;
      case 500:
        alert('Sorry, an unexpected behaviour happened with the server, you should ask support.');
        break;
      default:
        alert(response.statusText);
        break;
    }

    return {response, result: undefined};
  }
}
