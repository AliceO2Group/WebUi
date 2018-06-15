import {Observable,} from '/js/src/index.js';
import RemoteData from '../common/RemoteData.js';

export default class Environment extends Observable {
  constructor(model) {
    super();

    this.model = model;
    this.item = RemoteData.NotAsked();
  }

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
