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
    this.plots = RemoteData.notAsked();
    this.currentTask = RemoteData.notAsked();
  }

  /**
   * Load all environments into `list` as RemoteData
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
   * Load one environment into `item` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async getEnvironment(body) {
    this.getPlotsList();
    this.item = RemoteData.loading();
    this.notify();
    const {result, ok} = await this.model.loader.post(`/api/GetEnvironment`, body);
    if (!ok) {
      this.item = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    console.log("Result);")
    result.environment.tasks.push(JSON.parse(JSON.stringify(result.environment.tasks[0])));
    result.environment.tasks[0].taskId = 'test'
    console.log(result);
    this.item = RemoteData.success(result);
    this.itemControl = RemoteData.notAsked(); // because item has changed
    this.notify();
  }

  /**
   * Control a remote environment, store action result into `itemControl` as RemoteData
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
    this.model.router.go(`?page=environment&id=${result.id}`);
    this.notify();
  }

  /**
   * Create a new remote environment, creation action result into `itemNew` as RemoteData
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
   * Set property of environment form, used for creation or update
   * @param {string} property
   * @param {string} value
   */
  setForm(property, value) {
    this.itemForm[property] = value;
    this.notify();
  }

  /**
   * Destroy a remote environment, store action result into `this.itemControl` as RemoteData
   * @param {Object} body - See protobuf definition for properties
   */
  async destroyEnvironment(body) {
    this.itemControl = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/DestroyEnvironment`, body);
    if (!ok) {
      this.model.notification.show(result.message, 'danger', 5000);
      this.itemControl = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.itemControl = RemoteData.notAsked();
    this.model.router.go(`?page=environments`);
  }

  /**
   * Method to retrieve plots source list
   */
  async getPlotsList() {
    this.plots = RemoteData.loading();
    const {result, ok} = await this.model.loader.get(`/api/PlotsList`);
    if (!ok) {
      this.plots = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    this.plots = RemoteData.success(result);
  }

  /**
   * Load Task into `item`
   * @param {JSON} body
  */
  async getTask(body) {
    this.currentTask = RemoteData.loading();
    this.notify();

    const {result, ok} = await this.model.loader.post(`/api/GetTask`, body);
    if (!ok) {
      this.currentTask = RemoteData.failure(result.message);
      this.notify();
      return;
    }
    delete result.task.commandInfo.shell;
    // result.task.commandInfo.shell = '\n testare zx\n testare'
    // white-space: pre-wrap;
    result.task.commandInfo.env = ['env1', 'env2', 'env3'];
    result.task.commandInfo.env = result.task.commandInfo.env.join('\n');
    result.task.commandInfo.arguments.push('file:/home/flp/readout.cfg');
    result.task.commandInfo.arguments = result.task.commandInfo.arguments.join(' ');
    result.task.commandInfo.taskId = '92df4798-9bf3-11e9-9c3f-02163e018d4a'
    this.currentTask = RemoteData.success(result.task.commandInfo);
    this.notify();
  }
}
