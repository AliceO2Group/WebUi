import {RemoteData} from '/js/src/index.js';

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
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }

  /**
   * Ask server for online mode service status
   */
  async isOnlineModeConnectionAlive() {
    const {ok} = await this.model.loader.get('/api/isOnlineModeConnectionAlive');
    if (ok) {
      return RemoteData.success(ok);
    } else {
      return RemoteData.failure(ok);
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
      return RemoteData.failure(`404: Object "${objectName}" could not be found.`);
    } else {
      return RemoteData.failure(`${status}: Object '${objectName}' could not be loaded`);
    }
  }

  /**
  * Ask server for an object by name and timestamp
  * @param {string} objectName
  * @param {timestamp} timestamp
  * @return {JSON} {result, ok, status}
  */
  async getObjectByNameTimestamp(objectName, timestamp) {
    const {result, ok, status} = await this.model.loader
      .get(`/api/readObjectData?objectName=${objectName}&timestamp=${timestamp}`);
    if (ok) {
      return RemoteData.success(result);
    } else if (status === 404) {
      return RemoteData.failure(`404: Object "${objectName}" could not be found.`);
    } else {
      return RemoteData.failure(`${status}: Object '${objectName}' could not be loaded`);
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

  /**
   * Get a list of timestamps of the passed object wrapped in RemoteData
   * @param {string} objectName
   * @return {RemoteData}
   */
  async getObjectTimestampList(objectName) {
    const {result, ok} = await this.model.loader.get(`/api/getObjectTimestampList?objectName=${objectName}`);
    if (ok) {
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }
}
