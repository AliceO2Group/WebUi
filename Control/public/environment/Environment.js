import {Observable, RemoteData} from '/js/src/index.js';

export default class Environment extends Observable {
  constructor(model) {
    super();

    this.model = model;
    this.list = RemoteData.NotAsked();
    this.item = RemoteData.NotAsked();
    this.itemControl = RemoteData.NotAsked();
    this.itemNew = RemoteData.NotAsked();
    this.itemForm = {};
  }

  async getEnvironments() {
    this.list = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/getEnvironments`);
    if (!ok) {
      this.list = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.Success(result);
    this.notify();
  }

  async getEnvironment(body) {
    this.item = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/getEnvironment`, body);
    if (!ok) {
      this.item = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.item = RemoteData.Success(result);
    this.itemControl = RemoteData.NotAsked(); // because item has changed
    this.notify();
  }

  async controlEnvironment(body) {
    this.itemControl = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/controlEnvironment`, body);
    if (!ok) {
      this.itemControl = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.Success(result);
    this.notify();
  }

  async newEnvironment() {
    this.itemNew = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/newEnvironment`, this.itemForm);
    if (!ok) {
      this.itemNew = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.itemNew = RemoteData.NotAsked();
    this.model.router.go(`?page=environment&id=${result.id}`);
  }

  setForm(property, value) {
    this.itemForm[property] = value;
    this.notify();
  }

  async destroyEnvironment(body) {
    this.itemControl = RemoteData.Loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/destroyEnvironment`, body);
    if (!ok) {
      this.itemControl = RemoteData.Failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.NotAsked();
    this.model.router.go(`?page=environments`);
  }
}
