/**
 * Implementation of the native EventTarget
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
export default class EventTarget {
  /**
   * Constructor
   */
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Attach a callback called when an event of type 'type' is dispatched.
   * @param {string} type
   * @param {function} listener
   */
  addEventListener(type, listener) {
    this.listeners.set(listener.bind(this), {
      type, listener
    });
  }

  /**
   * Remove an previously added listener
   * @param {string} type
   * @param {function} listener
   */
  removeEventListener(type, listener) {
    for (let [key, value] of this.listeners) {
      if (value.type !== type || listener !== value.listener) {
        continue;
      }
      this.listeners.delete(key);
    }
  }

  /**
   * Dispatch a 'Event' instance to the listeners
   * @param {Event} event - ex: new Event('type', {data})
   */
  dispatchEvent(event) {
    Object.defineProperty(event, 'target', {value: this});

    if (this['on' + event.type]) {
      this['on' + event.type](event);
    }

    for (let [key, value] of this.listeners) {
      if (value.type !== event.type) {
        continue;
      }
      key(event);
    }
  }
}
