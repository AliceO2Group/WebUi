import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing FrameworkInfo (or status, to be seen in future what is this)
 */
export default class FrameworkInfo extends Observable {
  /**
   * Initialize `aliEcs` to NotAsked
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.aliEcs = RemoteData.notAsked();
    this.control = RemoteData.notAsked();
  }

  /**
   * Load AliECS into `aliEcs`
   */
  async getAliECSInfo() {
    this.aliEcs = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetFrameworkInfo`);
    if (!ok) {
      this.aliEcs = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.aliEcs = RemoteData.success(result);
    this.notify();
  }

  /**
   * Load
   */
  async getFrameworkInfo() {
    this.control = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.get('/api/getFrameworkInfo');
    if (!ok) {
      this.control = RemoteData.failure(result.message);
      this.model.notification.show(`Unable to retrieve framework information`, 'danger', 2000);
    } else {
      this.control = RemoteData.success(result);
    }
    this.notify();
  }
}
