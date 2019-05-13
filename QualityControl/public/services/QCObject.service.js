import {fetchClient} from '/js/src/index.js';

/**
 * Quality Control Object service to get/send data
 */
export default class QCObjectService {
  /**
   * Initialize service
   * @param {Object} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Ask server for all available objects
   * @return {JSON} List of Objects
   */
  async getObjects() {
    const req = fetchClient(`/api/listObjects`, {method: 'GET'});
    this.model.loader.watchPromise(req);
    const res = await req;
    return await res.json();
  }

  /**
  * Ask server for an object by name
  * @param {string} objectName
  * @return {JSON} {result, ok, status}
  */
  async getObjectByName(objectName) {
    return await this.model.loader.get(`/api/readObjectData?objectName=${objectName}`);
  }

  /**
   * Ask server for multiple objects by their name
   * @param {[string]} objectsNames
   */
  async getObjectsByName(objectsNames) {
    return await this.model.loader.post(`/api/readObjectsData`, {objectsNames});
  }
}
