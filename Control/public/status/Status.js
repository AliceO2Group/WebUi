import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing FrameworkInfo (or status, to be seen in future what is this)
 */
export default class FrameworkInfo extends Observable {
  /**
   * Initialize `item` to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.item = RemoteData.notAsked();
  }

  /**
   * Load FrameworkInfo into `item`
   */
  async getFrameworkInfo() {
    this.item = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/getFrameworkInfo`);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.item = RemoteData.success(result);
    this.notify();
  }
}
