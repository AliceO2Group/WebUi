import {RemoteData} from '/js/src/index.js';

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
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }

  /**
   * Ask server for all available objects
   * @return {JSON} List of Objects
   */
  async getOnlineObjects() {
    const {result, ok} = await this.model.loader.get('/api/listOnlineObjects');
    if (ok) {
      const t= [{"name":"QcTask/example"}, {"name":"ITSRAWDS/example"}, {"name":"ITSRAWDS/HIGMAP0Lay0"}, {"name":"QCClusterTask/ClusNumEtaPhiLay2"}];
      return RemoteData.success(t);
    } else {
      return RemoteData.failure(result);
    }
  }

  /**
  * Ask server for an object by name
  * @param {string} objectName
  * @return {JSON} {result, ok, status}
  */
  async getObjectByName(objectName) {
    const {result, ok, status} = await this.model.loader.get(`/api/readObjectData?objectName=${objectName}`);
    if (ok) {
      return RemoteData.success(result);
    } else if (status === 404) {
      return RemoteData.failure(`Object "${objectName}" could not be found.`);
    } else {
      return RemoteData.failure(`Object "${objectName}" could not be displayed. ${result.message}`);
    }
  }

  /**
   * Ask server for multiple objects by their name
   * @param {[string]} objectsNames
   */
  async getObjectsByName(objectsNames) {
    const {result, ok} = await this.model.loader.post(`/api/readObjectsData`, {objectsNames});
    if (ok) {
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }
}
