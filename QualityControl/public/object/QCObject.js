/* global JSROOT */

import {Observable, RemoteData, iconArrowTop} from '/js/src/index.js';
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

    this.selected = null; // object - id of object
    this.selectedOpen = false;
    this.objects = {}; // objectName -> RemoteData
    this.objectsReferences = {}; // object name -> number of each object being
    this.qcObjectService = new QCObjectService(this.model);

    this.listOnline = []; // list of online objects name
    this.isOnlineModeConnectionAlive = false;
    this.isOnlineModeEnabled = false; // show only online objects or all (offline)
    this.onlineModeAvailable = false; // true if data are coming from server

    this.searchInput = ''; // string - content of input search
    this.searchResult = []; // array<object> - result list of search
    this.sortBy = {
      field: 'name',
      title: 'Name',
      order: 1,
      icon: iconArrowTop(),
      open: false
    };

    this.refreshTimer = 0;
    this.refreshInterval = 0; // seconds

    this.tree = new ObjectTree('database');
    this.tree.bubbleTo(this);

    this.sideTree = new ObjectTree('online');
    this.sideTree.bubbleTo(this);
    this.queryingObjects = false;
  }

  /**
   * Toggle mode (Online/Offline)
   */
  toggleMode() {
    this.isOnlineModeEnabled = !this.isOnlineModeEnabled;
    if (this.isOnlineModeEnabled) {
      this.setRefreshInterval(60);
    } else {
      this.loadList();
      clearTimeout(this.refreshTimer);
    }
    this.selected = null;
    this.searchInput = '';
    this.notify();
  }

  /**
   * Method to toggle the box displaying more information about the histogram
   * @param {string} objectName
   */
  toggleInfoArea(objectName) {
    this.selectedOpen = !this.selectedOpen;
    this.notify();
    if (objectName) {
      if (!this.list) {
        this.selected = {name: objectName};
      } else if (this.selectedOpen && this.list
        && ((this.selected && !this.selected.lastModified)
          || !this.selected)
      ) {
        this.selected = this.list.find((object) => object.name === objectName);
      }
    }
    this.notify();
  }

  /**
   * Method to display sideTree(edit layout mode) based on onlineList / offlineList
   * @param {boolean} isOnlineListRequested
   */
  toggleSideTree(isOnlineListRequested) {
    this.sideTree.bubbleTo(this);
    if (isOnlineListRequested) {
      this.sideTree.initTree('online');
      this.sideTree.addChildren(this.listOnline);
    } else {
      this.sideTree.initTree('database');
      this.sideTree.addChildren(this.list);
    }
    this.notify();
  }

  /**
   * Toggle the display of the sort by dropdown
   */
  toggleSortDropdown() {
    this.sortBy.open = !this.sortBy.open;
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
    } else {
      this.searchResult = [];
    }
  }

  /**
   * Method to sort a list of JSON objects by one of its fields
   * @param {Array<JSON>} listSource
   * @param {string} field
   * @param {string} order
   */
  sortListByField(listSource, field, order) {
    listSource.sort((a, b) => {
      if (field === 'createTime') {
        if (a[field] < b[field]) {
          return -1 * order;
        } else {
          return 1 * order;
        }
      } else if (field === 'name') {
        if (a[field].toUpperCase() < b[field].toUpperCase()) {
          return -1 * order;
        } else {
          return 1 * order;
        }
      }
    });
  }

  /**
   * Sort Tree of Objects by specified field and order
   * @param {string} title
   * @param {string} field
   * @param {number} order {-1; 1}
   * @param {function} icon
   */
  sortTree(title, field, order, icon) {
    this.sortListByField(this.currentList, field, order);
    if (!this.isOnlineModeEnabled) {
      this.tree.initTree('database');
      this.tree.addChildren(this.currentList);
    } else {
      this.tree.initTree('online');
      this.tree.addChildren(this.currentList);
    }

    this._computeFilters();

    this.sortBy = {
      field: field,
      title: title,
      order: order,
      icon: icon,
      open: false
    };
    this.notify();
  }

  /**
   * Ask server for all available objects, fills `tree` of objects
   */
  async loadList() {
    if (!this.isOnlineModeEnabled) {
      this.queryingObjects = true;
      let offlineObjects = [];
      const result = await this.qcObjectService.getObjects();
      if (result.isSuccess()) {
        offlineObjects = result.payload;
      } else {
        this.model.notification.show(`Failed to retrieve list of objects due to ${result.message}`, 'danger', Infinity);
      }
      this.list = offlineObjects;

      this.tree.initTree('database');
      this.tree.addChildren(offlineObjects);

      this.sideTree.initTree('database');
      this.sideTree.addChildren(offlineObjects);

      this.currentList = offlineObjects;
      this.sortBy = {
        field: 'name',
        title: 'Name',
        order: 1,
        icon: iconArrowTop(),
        open: false
      };
      this._computeFilters();

      if (this.selected && !this.selected.lastModified) {
        this.selected = this.list.find((object) => object.name === this.selected.name);
      }
      this.queryingObjects = false;
      this.notify();
    } else {
      this.loadOnlineList();
    }
  }

  /**
   * Method to check if OnlineService Connection is alive
   */
  async checkOnlineStatus() {
    const result = await this.qcObjectService.isOnlineModeConnectionAlive();
    if (result.isSuccess()) {
      this.isOnlineModeConnectionAlive = true;
    } else {
      this.isOnlineModeConnectionAlive = false;
    }
  }

  /**
   * Ask server for online objects and fills tree with them
   */
  async loadOnlineList() {
    let onlineObjects = [];
    const result = await this.qcObjectService.getOnlineObjects();
    if (result.isSuccess()) {
      onlineObjects = result.payload;
      this.sortListByField(onlineObjects, 'name', 1);
      this.sortBy = {
        field: 'name',
        title: 'Name',
        order: 1,
        icon: iconArrowTop(),
        open: false
      };
    } else {
      const failureMessage = `Failed to retrieve list of online objects due to ${result.message}`;
      this.model.notification.show(failureMessage, 'danger', Infinity);
    }

    this.tree.initTree('online');
    this.tree.addChildren(onlineObjects);

    this.listOnline = onlineObjects;
    this.currentList = onlineObjects;
    this.search('');
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

    const result = await this.qcObjectService.getObjectByName(objectName);
    if (result.isSuccess()) {
      if (this.isObjectChecker(result.payload)) {
        this.objects[objectName] = RemoteData.success(result.payload);
      } else {
        // link JSROOT methods to object
        // eslint-disable-next-line
        this.objects[objectName] = RemoteData.success(JSROOT.JSONR_unref(result.payload));
      }
    } else {
      this.objects[objectName] = result;
    }
    this.notify();
  }

  /**
   * Method to check if passed object type is a checker
   * @param {JSON} object
   * @return {boolean}
   */
  isObjectChecker(object) {
    const objectType = object['_typename'];
    if (objectType && objectType.toLowerCase().includes('qualityobject')) {
      return true;
    } else {
      return false;
    }
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
   * Method to search for the object which info was requested for and return lastModified timestamp
   * @param {string} objectName
   * @return {string}
   */
  getLastModifiedByName(objectName) {
    const object = this.currentList.find((object) => object.name === objectName);
    if (object) {
      return new Date(object.lastModified).toLocaleString();
    }
    return 'Loading...';
  }

  /**
   * Reload currently used objects which have a number of references greater or equal to 1
   * @param {Array.<string>} objectsName - e.g. /FULL/OBJECT/PATH
   */
  async loadObjects(objectsName) {
    if (!objectsName || !objectsName.length) {
      return;
    }

    const result = await this.qcObjectService.getObjectsByName(objectsName);
    if (!result.isSuccess()) {
      // it should be always status=200 for this request
      this.model.notification.show('Failed to refresh plots when contacting server', 'danger', Infinity);
      return;
    }

    // eslint-disable-next-line
    const objects = JSROOT.JSONR_unref(result.payload);
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

    // Refreshed currently seen objects
    this.loadObjects(Object.keys(this.objects));
    this.loadOnlineList();

    // refreshTimer is a timer id (number) and is also used in the view to
    // interpret new cycle when this number changes
  }

  /**
   * Set the current selected object by user
   * @param {QCObject} object
   */
  select(object) {
    if (this.currentList.length > 0) {
      this.selected = this.currentList.find((obj) => obj.name === object.name);
    } else {
      this.selected = object;
    }
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

  /**
   * Method to check if an object is in online mode
   * @param {string} objectName format: QcTask/example
   * @return {boolean}
   */
  isObjectInOnlineList(objectName) {
    return this.isOnlineModeEnabled && this.listOnline && this.listOnline.map((item) => item.name).includes(objectName);
  }


  /**
   * Method to generate drawing options based on where in the application the plot is displayed
   * @param {Object} tabObject
   * @param {Object} objectRemoteData
   * @return {Array<string>}
   */
  generateDrawingOptions(tabObject, objectRemoteData) {
    let objectOptionList = [];
    let drawingOptions = [];
    if (objectRemoteData.payload.fOption && objectRemoteData.payload.fOption !== '') {
      objectOptionList = objectRemoteData.payload.fOption.split(' ');
    }
    switch (this.model.page) {
      case 'objectTree':
        drawingOptions = JSON.parse(JSON.stringify(objectOptionList));
        break;
      case 'layoutShow': {
        if (!tabObject.ignoreDefaults) {
          tabObject.options.forEach((option) => {
            if (objectOptionList.indexOf(option) < 0) {
              objectOptionList.push(option);
            }
          });
          drawingOptions = JSON.parse(JSON.stringify(objectOptionList));
        } else {
          drawingOptions = JSON.parse(JSON.stringify(tabObject.options));
        }
        // merge all options or ignore if in layout view and user specifies so
        break;
      }
      case 'objectView': {
        const layoutId = this.model.router.params.layoutId;
        const objectId = this.model.router.params.objectId;

        if (!layoutId || !objectId) {
          drawingOptions = JSON.parse(JSON.stringify(objectOptionList));
        } else {
          if (this.model.layout.requestedLayout.isSuccess()) {
            let objectData = {};
            this.model.layout.requestedLayout.payload.tabs.forEach((tab) => {
              const obj = tab.objects.find((object) => object.id === objectId);
              if (obj) {
                objectData = obj;
              }
            });
            if (!objectData.ignoreDefaults) {
              objectData.options.forEach((option) => {
                if (objectOptionList.indexOf(option) < 0) {
                  objectOptionList.push(option);
                }
              });
              drawingOptions = JSON.parse(JSON.stringify(objectOptionList));
            } else {
              drawingOptions = JSON.parse(JSON.stringify(objectData.options));
            }
          }
        }
        break;
      }
      default:
        drawingOptions = objectOptionList;
        break;
    }
    return drawingOptions;
  }

  /**
   * Method to parse through tabs and objects of a layout to return one object by ID
   * @param {Object} layout
   * @param {string} objectId
   * @return {string}
   */
  getObjectNameByIdFromLayout(layout, objectId) {
    let objectName = '';
    layout.tabs.forEach((tab) => {
      const obj = tab.objects.find((object) => object.id === objectId);
      if (obj) {
        objectName = obj.name;
      }
    });
    return objectName;
  }
}
