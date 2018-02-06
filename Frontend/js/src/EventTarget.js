/**
 * Implementation of the native EventTarget
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
export default class EventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    this.listeners.set(listener.bind(this), {
      type, listener
    });
  }

  removeEventListener(type, listener) {
    for (let [key, value] of this.listeners) {
      if (value.type !== type || listener !== value.listener) {
        continue;
      }
      this.listeners.delete(key);
    }
  }

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
