/* global JSROOT */

import {Observable, RemoteData} from '/js/src/index.js';
import QCObjectService from './../services/QCObject.service.js';
import ObjectTree from './ObjectTree.class.js';
/**
 * Model namespace for all about QC's objects (not javascript objects)
 */
export default class QCObject extends Observable {
  /**
   * Initialize model with empty values
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.currentList = [];
    this.list = null;
    this.tree = null; // ObjectTree

    this.selected = null; // object - id of object
    this.objects = {}; // objectName -> RemoteData
    this.objectsReferences = {}; // object name -> number of each object being
    this.qcObjectService = new QCObjectService(model);

    this.listOnline = []; // list of online objects name
    this.isOnlineModeEnabled = false; // show only online objects or all (offline)
    this.onlineModeAvailable = false; // true if data are coming from server

    this.searchInput = ''; // string - content of input search
    this.searchResult = []; // array<object> - result list of search

    this.refreshTimer = 0;
    this.refreshInterval = 0; // seconds
    this.setRefreshInterval(60);
  }

  /**
   * Toggle mode (Online/Offline)
   */
  toggleMode() {
    this.isOnlineModeEnabled = !this.isOnlineModeEnabled;
    this.selected = null;
    this.loadList();
    this.notify();
  }

  /**
   * Computes the final list of objects to be seen by user depending on those factors:
   * - online filter enabled
   * - online objects according to information service
   * - search input from user
   * If any of those changes, this method should be called to update the outputs.
   */
  _computeFilters() {
    if (this.searchInput) {
      const listSource = (this.isOnlineModeEnabled ? this.listOnline : this.list) || []; // with fallback
      const fuzzyRegex = new RegExp(this.searchInput.split('').join('.*?'), 'i');
      this.searchResult = listSource.filter((item) => {
        return item.name.match(fuzzyRegex);
      });
    }
  }

  /**
   * Ask server for all available objects, fills `tree` of objects
   */
  async loadList() {
    let objects = [];
    if (!this.isOnlineModeEnabled) {
      objects = await this.qcObjectService.getObjects();
      this.listOnline = [];
      this.list = objects;
    } else {
      objects = await this.qcObjectService.getOnlineObjects();
      this.listOnline = objects;
    }
    this.tree = new ObjectTree('database');
    this.tree.bubbleTo(this);
    this.tree.addChildrens(objects);
    this.currentList = objects;
    this._computeFilters();
    this.notify();
  }

  /**
   * Load full content of an object in-memory, do nothing if already in.
   * Also adds a reference to this object.
   * @param {string} objectName - e.g. /FULL/OBJECT/PATH
   */
  async addObjectByName(objectName) {
    if (!this.objectsReferences[objectName]) {
      this.objectsReferences[objectName] = 1;
    } else {
      this.objectsReferences[objectName]++;
      return;
    }

    // we don't put a RemoteData.Loading() state to avoid blinking between 2 loads

    const {result, ok, status} = await this.qcObjectService.getObjectByName(objectName);
    if (ok) {
      // TODO Move on service side
      // link JSROOT methods to object
      // eslint-disable-next-line
      this.objects[objectName] = RemoteData.success(JSROOT.JSONR_unref(result));
    } else if (status === 404) {
      this.objects[objectName] = RemoteData.failure('Object not found');
    } else {
      this.objects[objectName] = RemoteData.failure(result.error);
    }

    this.notify();
  }

  /**
   * Removes a reference to the specified object and unload it from memory if not used anymore
   * @param {string} objectName - The object name like /FULL/OBJ/NAME
   */
  removeObjectByName(objectName) {
    this.objectsReferences[objectName]--;

    // No more used
    if (!this.objectsReferences[objectName]) {
      delete this.objects[objectName];
      delete this.objectsReferences[objectName];
    }

    this.notify();
  }

  /**
   * Reload currently used objects which have a number of references greater or equal to 1
   * @param {Array.<string>} objectsName - e.g. /FULL/OBJECT/PATH
   */
  async loadObjects(objectsName) {
    if (!objectsName || !objectsName.length) {
      return;
    }

    const {result, ok} = await this.qcObjectService.getObjectsByName(objectsName);
    if (!ok) {
      // TODO move on service side
      // it should be always status=200 for this request
      this.notification.show('Failed to refresh plots when contacting server', 'danger', Infinity);
      return;
    }

    // eslint-disable-next-line
    const objects = JSROOT.JSONR_unref(result);
    for (const name in objects) {
      if (objects[name].error) {
        this.objects[name] = RemoteData.failure(objects[name].error);
      } else {
        this.objects[name] = RemoteData.success(objects[name]);
      }
    }

    this.notify();
  }

  /**
   * Indicate that the object loaded is wrong. Used after trying to print it with jsroot
   * @param {string} name - name of the object
   */
  invalidObject(name) {
    this.objects[name] = RemoteData.failure('JSROOT was unable to draw this object');
    this.notify();
  }

  /**
   * Set the interval to update objects currently loaded and shown to user,
   * this will reload only data associated to them
   * @param {number} intervalSeconds - in seconds
   */
  setRefreshInterval(intervalSeconds) {
    // Stop any other timer
    clearTimeout(this.refreshTimer);

    // Validate user input
    let parsedValue = parseInt(intervalSeconds, 10);
    if (isNaN(parsedValue) || parsedValue < 1) {
      parsedValue = 2;
    }

    // Start new timer
    this.refreshInterval = parsedValue;
    this.refreshTimer = setTimeout(() => {
      this.setRefreshInterval(this.refreshInterval);
    }, this.refreshInterval * 1000);
    this.notify();

    if (this.isOnlineModeEnabled) {
      // Refreshed currently seen objects
      this.loadObjects(Object.keys(this.objects));
      this.loadList();
    }

    // refreshTimer is a timer id (number) and is also used in the view to
    // interpret new cycle when this number changes
  }

  /**
   * Set the current selected object by user
   * @param {QCObject} object
   */
  select(object) {
    this.selected = object;
    this.notify();
  }

  /**
   * Set the current user search string and compute next visible list of objects
   * @param {string} searchInput
   */
  search(searchInput) {
    this.searchInput = searchInput;
    this._computeFilters();
    this.notify();
  }
}
