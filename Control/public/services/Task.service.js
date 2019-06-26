import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Task (or status, to be seen in future what is this)
 */
export default class TaskService extends Observable {
  /**
   * Initialize `item` to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;
  }

  /**
   * Load Task into `item`
   */
  async getTask() {
    this.item = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetTask`);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    console.log("GetTask")
    console.log(result)
    this.item = RemoteData.success(result);
    this.notify();
  }
}
