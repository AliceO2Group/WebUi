/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

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

    this.objectsRemote = RemoteData.notAsked();
    this.selected = null; // object - { name; createTime; lastModified; }
    this.selectedOpen = false;
    this.objects = {}; // objectName -> RemoteData.payload -> plot

    this.qcObjectService = new QCObjectService(this.model);

    this.listOnline = []; // list of online objects name

    this.searchInput = ''; // string - content of input search
    this.searchResult = []; // array<object> - result list of search
    this.sortBy = {
      field: 'name',
      title: 'Name',
      order: 1,
      icon: iconArrowTop(),
      open: false
    };

    this.tree = new ObjectTree('database');
    this.tree.bubbleTo(this);

    this.sideTree = new ObjectTree('online');
    this.sideTree.bubbleTo(this);
    this.queryingObjects = false;
    this.scrollTop = 0;
    this.scrollHeight = 0;
  }

  /**
   * Set searched items table UI sizes to allow virtual scrolling
   * @param {number} scrollTop - position of the user's scroll cursor
   * @param {number} scrollHeight - height of table's viewport (not content height which is higher)
   */
  setScrollTop(scrollTop, scrollHeight) {
    this.scrollTop = scrollTop;
    this.scrollHeight = scrollHeight;
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
      const listSource = (this.model.isOnlineModeEnabled ? this.listOnline : this.list) || []; // with fallback
      const fuzzyRegex = new RegExp(this.searchInput, 'i');
      this.searchResult = listSource.filter((item) => {
        return fuzzyRegex.test(item.name);
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
    if (!this.model.isOnlineModeEnabled) {
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
    if (!this.model.isOnlineModeEnabled) {
      this.objectsRemote = RemoteData.loading();
      this.notify();
      this.queryingObjects = true;
      let offlineObjects = [];
      const result = await this.qcObjectService.getObjects();
      if (result.isSuccess()) {
        offlineObjects = result.payload;
      } else {
        const failureMessage = `Failed to retrieve list of objects. Please contact an administrator`;
        this.model.notification.show(failureMessage, 'danger', Infinity);
      }
      this.sortListByField(offlineObjects, this.sortBy.field, this.sortBy.order);
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
      this.objectsRemote = RemoteData.success();
      this.notify();
    } else {
      this.loadOnlineList();
    }
  }

  /**
   * Ask server for online objects and fills tree with them
   */
  async loadOnlineList() {
    this.objectsRemote = RemoteData.loading();
    this.queryingObjects = true;
    this.notify();
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
      const failureMessage = `Failed to retrieve list of online objects. Please contact an administrator`;
      this.model.notification.show(failureMessage, 'danger', Infinity);
    }

    this.tree.initTree('online');
    this.tree.addChildren(onlineObjects);

    this.listOnline = onlineObjects;
    this.currentList = onlineObjects;
    this.search('');
    this.objectsRemote = RemoteData.success();
    this.queryingObjects = false;

    this.notify();
  }

  /**
   * Load full content of an object in-memory
   * @param {string} objectName - e.g. /FULL/OBJECT/PATH
   * @param {number} timestamp
   */
  async loadObjectByName(objectName, timestamp = -1) {
    this.objects[objectName] = RemoteData.loading();
    this.notify();
    const obj = await this.qcObjectService.getObjectByName(objectName, timestamp);

    // TODO Is it a TTree?
    if (obj.isSuccess()) {
      if (this.isObjectChecker(obj.payload.qcObject)) {
        this.objects[objectName] = obj;
        this.notify();
      } else {
        // link JSROOT methods to object. JSROOT.parse call was removed due to bug
        this.objects[objectName] = RemoteData.success(obj.payload);
        this.notify();
      }
      if (this.selected) {
        this.selected.version = timestamp === -1 ?
          parseInt(this.objects[objectName].payload.timestamps[0]) : parseInt(timestamp);
      }
    } else {
      this.objects[objectName] = obj;
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
   * Load objects provided by a list of paths
   * @param {Array.<string>} objectsName - e.g. /FULL/OBJECT/PATH
   */
  async loadObjects(objectsName) {
    this.objectsRemote = RemoteData.loading();
    this.objects = {}; // remove any in-memory loaded objects
    this.notify();
    if (!objectsName || !objectsName.length) {
      this.objectsRemote = RemoteData.success();
      this.notify();
      return;
    }

    await Promise.allSettled(
      objectsName.map(async (objectName) => {
        this.objects[objectName] = RemoteData.Loading()
        this.notify();
        this.objects[objectName] = await this.qcObjectService.getObjectByNameOnly(objectName);
        this.notify();
      })
    );
    this.objectsRemote = RemoteData.success();
    this.notify();
  }

  /**
   * Refreshes currently displayed objects and requests an updated list
   * of online objects from Consul
   */
  refreshObjects() {
    this.loadObjects(Object.keys(this.objects));
    this.loadOnlineList();
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
   * Set the current selected object by user
   * Search within `currentList`;
   * If user is in online mode, `list` will be used instead
   * @param {QCObject} object
   */
  async select(object) {
    if (this.currentList.length > 0) {
      this.selected = this.currentList.find((obj) => obj.name === object.name);
    }
    if (!this.selected && this.list && this.list.length > 0) {
      this.selected = this.list.find((obj) => obj.name === object.name);
    }
    if (!this.selected) {
      this.selected = object;
    }
    await this.loadObjectByName(object.name);
    this.notify();
  }

  /**
   * Set the current user search string and compute next visible list of objects
   * @param {string} searchInput
   */
  search(searchInput) {
    this.searchInput = searchInput;
    this._computeFilters();
    this.sortListByField(this.searchResult, this.sortBy.field, this.sortBy.order);
    this.notify();
  }

  /**
   * Method to check if an object is in online mode
   * @param {string} objectName format: QcTask/example
   * @return {boolean}
   */
  isObjectInOnlineList(objectName) {
    return this.model.isOnlineModeEnabled && this.listOnline
      && this.listOnline.map((item) => item.name).includes(objectName);
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
    const qcObject = objectRemoteData.payload.qcObject;
    if (qcObject.fOption) {
      objectOptionList = qcObject.fOption.split(' ');
    }
    if (qcObject.metadata && qcObject.metadata.drawOptions) {
      const metaOpt = qcObject.metadata.drawOptions.split(' ');
      objectOptionList = objectOptionList.concat(metaOpt);
    }
    if (qcObject.metadata && qcObject.metadata.displayHints) {
      const metaHints = qcObject.metadata.displayHints.split(' ');
      objectOptionList = objectOptionList.concat(metaHints);
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
          // object opened from tree view -> use only its own options
          drawingOptions = JSON.parse(JSON.stringify(objectOptionList));
        } else {
          // object opened from layout view -> use the layout/tab configuration
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

  /**
   * Method to search for the object which info was requested for and return lastModified timestamp
   * @param {string} objectName
   * @return {string}
   */
  getLastModifiedByName(objectName) {
    if (this.currentList.length === 0) {
      return 'Loading ...';
    }
    const object = this.currentList.find((object) => object.name === objectName);
    if (object) {
      return new Date(object.lastModified).toLocaleString('en-UK');
    }
    return '-';
  }

  /**
   * Sends back the timestamp/date for the selected object based on
   * preferred format
   * @param {boolean} displayDate
   * @return {string}
   */
  getLastModifiedForSelected(displayDate = false) {
    if (this.selected && this.selected.lastModified) {
      return displayDate === 'date' ?
        new Date(this.selected.lastModified).toLocaleString('en-UK') : this.selected.lastModified.toString();
    } else {
      return '-';
    }
  }

  /**
   * Return the list of object timestamps
   * @param {string} name
   * @return {array<numbers>}
   */
  getObjectTimestamps(name) {
    if (this.objects[name] && this.objects[name].kind === 'Success') {
      return this.objects[name].payload.timestamps;
    } else {
      return [];
    }
  }

  /**
   * Convert a timestamp to a date string in browser format
   * @param {number} timestamp
   * @return {string}
   */
  getDateFromTimestamp(timestamp) {
    try {
      return new Date(timestamp).toLocaleString('en-UK');
    } catch (_err) {
      return 'Invalid Timestamp';
    }
  }
}
