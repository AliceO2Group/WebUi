import {Observable} from '/js/src/index.js';

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
}
