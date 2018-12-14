import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Workflow
 */
export default class Workflow extends Observable {
  /**
   * Initialize `list` to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.list = RemoteData.notAsked();
  }

  /**
   * Load workflows into `list` as RemoteData
   */
  async get() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetWorkflows`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.success(result);
    this.notify();
  }
}
