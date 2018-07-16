import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing FrameworkInfo (or status, to be seen in future what is this)
 */
export default class FrameworkInfo extends Observable {
  /**
   * Initialize `item` to NotAsked
   */
  constructor(model) {
    super();

    this.model = model;
    this.item = RemoteData.NotAsked();
  }

  /**
   * Load FrameworkInfo into `item`
   */
  async getFrameworkInfo() {
    this.item = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/getFrameworkInfo`);
    if (!ok) {
      this.item = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.item = RemoteData.Success(result);
    this.notify();
  }
}
