import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Environment CRUD
 */
export default class Environment extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   */
  constructor(model) {
    super();

    this.model = model;
    this.list = RemoteData.NotAsked();
    this.item = RemoteData.NotAsked();
    this.itemControl = RemoteData.NotAsked();
    this.itemNew = RemoteData.NotAsked();
    this.itemForm = {};
  }

  /**
   * Load all environements into `list` as RemoteData
   */
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

  /**
   * Load one environement into `item` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
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

  /**
   * Control a remote environement, store action result into `itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
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

  /**
   * Create a new remote environement, creation action result into `itemNew` as RemoteData
   * Form data must be stored inside `this.itemForm`
   * See protobuf definition for properties of `this.itemForm` as body
   */
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
