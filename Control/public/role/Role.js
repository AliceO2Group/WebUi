import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Role CRUD
 */
export default class Role extends Observable {
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
   * Load roles into `list` as RemoteData
   */
  async getRoles() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/getRoles`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.success(result);
    this.notify();
  }
}
