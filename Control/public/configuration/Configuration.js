import {Observable, RemoteData} from '/js/src/index.js';

/**
 * Model representing Configuration CRUD
 */
export default class Configuration extends Observable {
  /**
   * Initialize all ajax calls to "NotAsked" type
   * @param {Observable} model
   */
  constructor(model) {
    super();

    this.model = model;
    this.cruList = RemoteData.notAsked();
  }


  /**
   * Method to retrieve a list of CRUs from Consul
   */
  async getCRUList() {
  }
}
