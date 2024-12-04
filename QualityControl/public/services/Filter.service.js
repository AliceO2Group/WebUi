import { RemoteData } from '/js/src/index.js';

export default class FilterService {
  constructor(model) {
    this.model = model;
    this.loader = model.loader;

    this.runTypes = RemoteData.notAsked();
  }

  async getRunTypes() {
    this.runTypes = RemoteData.loading();
    this.model.notify();
    try {
      const { result, ok } = await this.loader.get('/api/runTypes');
      if (ok) {
        result.sort();
        this.runTypes = RemoteData.success(result);
      } else {
        this.runTypes = RemoteData.failure('Error retrieving runTypes');
      }
    } catch (error) {
      this.runTypes = RemoteData.failure(error.message);
    } finally {
      this.model.notify();
    }
  }

  initFilterService() {
    this.getRunTypes();
  }
}
