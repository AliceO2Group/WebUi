/**
 * Simple Observable class to notify others listening for changes
 */
class Observable {
  /**
   * Initialize observable with an empty array
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
   * titre
   * @param {Observable} observer - the observable object which will notify its observers
   */
  bubbleTo(observer) {
    this.observe(() => observer.notify());
  }
}

export default Observable;
