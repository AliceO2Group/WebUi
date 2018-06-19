import {Observable, RemoteData} from '/js/src/index.js';

export default class Environment extends Observable {
  constructor(model) {
    super();

    this.model = model;
    this.list = RemoteData.NotAsked();
  }

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
