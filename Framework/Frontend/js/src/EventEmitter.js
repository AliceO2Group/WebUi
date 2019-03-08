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
 * Class EventEmitter for event-driven architecture
 * Similar to the one provided by NodeJS
 */
class EventEmitter {
  /**
   * Constructor
   */
  constructor() {
    this.listeners = new Map(); // <string, Array<Function>>
  }

  /**
   * Adds the listener function to the end of the listeners array for the event named eventName
   * @param {string} eventName - the name of the event
   * @param {function} listener - the callback function
   * @return {boolean} - Returns a reference to the EventEmitter, so that calls can be chained.
   */
  addListener(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName).push(listener);

    return this;
  }

  /**
   * Removes the specified listener from the listener array for the event named eventName
   * @param {string} eventName - the name of the event
   * @param {function} listener - the callback function
   * @return {boolean} - Returns a reference to the EventEmitter, so that calls can be chained.
   */
  removeListener(eventName, listener) {
    if (!this.listeners.has(eventName)) {
      // eventName not found
      return this;
    }

    const listeners = this.listeners.get(eventName);
    const index = listeners.indexOf(listener);

    if (index === -1) {
      // listener not found
      return this;
    }

    listeners.splice(index, 1);

    return this;
  }

  /**
   * Synchronously calls each of the listeners registered for the event named eventName,
   * in the order they were registered, passing the supplied arguments to each
   * @param {string} eventName
   * @param {any} ...args - arguments to be passed to the listeners
   * @return {boolean} - Returns true if the event had listeners, false otherwise.
   */
  emit(eventName, ...args) {
    if (!this.listeners.has(eventName)) {
      // eventName not found
      return false;
    }

    const listeners = this.listeners.get(eventName);
    listeners.forEach((listener) => {
      listener(...args);
    });

    return true;
  }
}

export default EventEmitter;
