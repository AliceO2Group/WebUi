import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Environment CRUD
 */
export default class Environment extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.list = RemoteData.notAsked();
    this.item = RemoteData.notAsked();
    this.itemControl = RemoteData.notAsked();
    this.itemNew = RemoteData.notAsked();
    this.itemForm = {};
  }

  /**
   * Load all environements into `list` as RemoteData
   */
  async getEnvironments() {
    this.list = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetEnvironments`);
    if (!ok) {
      this.list = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.list = RemoteData.success(result);
    this.notify();
  }

  /**
   * Load one environement into `item` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async getEnvironment(body) {
    this.item = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.model.loader.post(`/api/GetEnvironment`, body);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.item = RemoteData.success(result);
    this.itemControl = RemoteData.notAsked(); // because item has changed
    this.notify();
  }

  /**
   * Control a remote environement, store action result into `itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async controlEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/ControlEnvironment`, body);
    if (!ok) {
      this.itemControl = RemoteData.failure(result.message);
      this.notify();

      return;
    }
    this.itemControl = RemoteData.success(result);
    this.itemNew = RemoteData.notAsked();
    console.log("result.id");
    console.log(result.id);
    this.model.router.go(`?page=environment&id=${result.id}`);
    this.notify();
  }

  /**
   * Create a new remote environement, creation action result into `itemNew` as RemoteData
   * Form data must be stored inside `this.itemForm`
   * See protobuf definition for properties of `this.itemForm` as body
   */
  async newEnvironment() {
    this.itemNew = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/NewEnvironment`, this.itemForm);
    if (!ok) {
      this.itemNew = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemNew = RemoteData.notAsked();
    this.model.router.go(`?page=environment&id=${result.environment.id}`);
  }

  /**
   * Set property of environement form, used for creation or update
   * @param {string} property
   * @param {string} value
   */
  setForm(property, value) {
    this.itemForm[property] = value;
    this.notify();
  }

  /**
   * Destroy a remote environement, store action result into `this.itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async destroyEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/DestroyEnvironment`, body);
    if (!ok) {
      this.itemControl = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.notAsked();
    this.model.router.go(`?page=environments`);
  }
}
