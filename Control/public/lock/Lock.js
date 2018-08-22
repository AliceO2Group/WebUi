import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Shadow model of Padlock, synchronize with the web server which contains the real one
 */
export default class Lock extends Observable {
  /**
   * Initialize lock state to NotAsked
 * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.padlockState = RemoteData.notAsked(); // {lockedBy, lockedByName}
  }

  /**
   * Set padlock state from ajax or websocket as a RemoteData
   * @param {string} padlockState - object representing PadLock from server
   */
  setPadlockState(padlockState) {
    this.padlockState = RemoteData.success(padlockState);
    this.notify();
  }

  /**
   * Load Padlock state from server
   */
  async synchronizeState() {
    this.padlockState = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/lockState`);
    if (!ok) {
      this.padlockState = RemoteData.failure(result.message);
      this.notify();
      this.model.notification.show('Fatal error while loading LOCK, please reload the page', 'danger', Infinity);
      return;
    }
    this.padlockState = RemoteData.success(result);
    this.notify();
  }

  /**
   * Ask server to get the lock of Control
   * Result of this action will be an update by WS
   */
  async lock() {
    this.padlockState = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/lock`);
    if (!ok) {
      this.model.notification.show(result.message, 'danger');
      return;
    }

    this.model.notification.show(`Lock taken`, 'success');
  }

  /**
   * Ask server to release the lock of Control
   * Result of this action will be an update by WS
   */
  async unlock() {
    this.padlockState = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/unlock`);
    if (!ok) {
      this.model.notification.show(result.message, 'danger');
      return;
    }

    this.model.notification.show(`Lock released`, 'success');
  }
}
