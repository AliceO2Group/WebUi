import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing FrameworkInfo
 */
export default class FrameworkInfo extends Observable {
  /**
   * Initialize remoteData items to NotAsked
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
    result.version = this.parseAliEcsVersion(result.version);
    this.aliEcs = RemoteData.success(result);
    this.notify();
  }

  /**
   * Load ControlGUI and its dependencies data in control-remoteData
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

  /**
   * Parse the JSON of the version and return it as a string
   * @param {JSON} versionJSON
   * @return {string}
   */
  parseAliEcsVersion(versionJSON) {
    let version = '';
    if (versionJSON.productName) {
      version += versionJSON.productName;
    }
    if (versionJSON.versionStr) {
      version += ' ' + versionJSON.versionStr;
    }
    if (versionJSON.build) {
      version += ' (revision ' + versionJSON.build + ')';
    }
    return version;
  }
}
