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

/**
 * Simple Observable class to notify others listening for changes
 * @example
 * const model = new Observable();
 * model.observe(() => console.log('model has changed'))
 * model.notify(); // callback called
 */
class Observable {
  /**
   * Initialize with an empty array of observers
   */
  constructor() {
    this.observers = [];
  }

  /**
   * Add an observer
   * @param {function} callback - will be called for each notification
   */
  observe(callback) {
    this.observers.push(callback);
  }

  /**
   * Remove an observer
   * @param {function} callback - the callback to remove
   */
  unobserve(callback) {
    this.observers = this.observers.filter((observer) => {
      return observer !== callback;
    });
  }

  /**
   * Notify every observer that something changed
   */
  notify() {
    this.observers.forEach((observer) => {
      observer(this);
    });
  }

  /**
   * All notifications from `this` will be notified to `observer`.
   * @param {Observable} observer - the observable object which will notify its observers
   * @example
   * const model1 = new Observable();
   * const model2 = new Observable();
   * const model3 = new Observable();
   * model1.bubbleTo(model2);
   * model2.bubbleTo(model3);
   * model1.notify(); // model1, model2 and model3 notified
   */
  bubbleTo(observer) {
    this.observe(() => observer.notify());
  }
}

export default Observable;
