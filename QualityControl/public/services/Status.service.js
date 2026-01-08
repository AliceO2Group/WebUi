import { RemoteData } from '/js/src/index.js'

export default class StatusService {
  /**
   * Initialize service
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    this.model = model;

    this.loader = model.loader;
    this.serviceConfig = RemoteData.notAsked();

    this.initStatusService();
  }

  async initStatusService() {
    const { result, ok } = await this.loader.get('api/services')
    if (ok) {
      this.serviceConfig = RemoteData.success(result || {});
    } else {
      this.serviceConfig = RemoteData.failure('Error retrieving services');
    }

    this.model.notify();
  }

  isConfigured(service) {
    if (!this.serviceConfig.isSuccess()) {
      return false;
    }

    return this.serviceConfig.payload.hasOwnProperty(service);
  }
}
