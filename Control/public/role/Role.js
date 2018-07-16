import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Role CRUD
 */
export default class Role extends Observable {
  /**
   * Initialize `list` to NotAsked
   */
  constructor(model) {
    super();

    this.model = model;
    this.list = RemoteData.NotAsked();
  }

  /**
   * Load roles into `list` as RemoteData
   */
  async getRoles() {
    this.list = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/getRoles`);
    if (!ok) {
      this.list = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.Success(result);
    this.notify();
  }
}
