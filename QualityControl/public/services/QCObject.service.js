import {fetchClient} from '/js/src/index.js';

/**
 * Quality Control Object service to get/send data
 * TODO Use remoteData
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
    const {result, ok} = await this.model.loader.get('/api/listObjects');
    if (ok) {
      return [];
    } else {
      this.model.notification.show(`Failed to retrieve list of objects due to ${result.message}`, 'danger', Infinity);
    }
    return result;
  }

  /**
   * Ask server for all available objects
   * @return {JSON} List of Objects
   */
  async getOnlineObjects() {
    const req = fetchClient(`/api/listOnlineObjects`, {method: 'GET'});
    this.model.loader.watchPromise(req);
    const res = await req;
    const test = await res.json();
    return test;
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
