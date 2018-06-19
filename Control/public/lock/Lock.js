import {Observable, RemoteData} from '/js/src/index.js';

export default class Lock extends Observable {
  constructor(model) {
    super();

    this.model = model;
    this.padlockState = { // Padlock state updated from server
      lockedBy: null,
      lockedByName: null,
    };
    this.padlockState = RemoteData.NotAsked();
  }

  setPadlockState(padlockState) {
    this.padlockState = RemoteData.Success(padlockState);
    this.notify();
  }

  async synchronizeState() {
    this.padlockState = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/lockState`);
    if (!ok) {
      this.padlockState = RemoteData.Failure(result.message);
      this.notify();
      alert('Fatal error while loading LOCK, please reload the page');
      return;
    }
    this.padlockState = RemoteData.Success(result);
    this.notify();
  }

  /**
   * Ask server to get the lock of Control
   * Result of this action will be an update by WS
   */
  async lock() {
    this.padlockState = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/lock`);
    if (!ok) {
      alert(result.message);
      return;
    }
  }

  /**
   * Ask server to release the lock of Control
   * Result of this action will be an update by WS
   */
  async unlock() {
    this.padlockState = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/unlock`);
    if (!ok) {
      alert(result.message);
      return;
    }
  }
}
