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

import { RemoteData, iconCaretTop, BrowserStorage } from '/js/src/index.js';
import ObjectTree from './ObjectTree.class.js';
import { simpleDebouncer, prettyFormatDate, setBrowserTabTitle } from './../common/utils.js';
import { isObjectOfTypeChecker } from './../library/qcObject/utils.js';
import { BaseViewModel } from '../common/abstracts/BaseViewModel.js';
import { StorageKeysEnum } from '../common/enums/storageKeys.enum.js';
import { updateWithPlotErrorOnQcRemoteData } from '../common/object/updateWithPlotErrorOnQcRemoteData.js';

/**
 * Model namespace for all about QC's objects (not javascript objects)
 */
export default class QCObject extends BaseViewModel {
  /**
   * Initialize model with empty values
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;

    this.currentList = [];
    this.list = null;

    this.objectsRemote = RemoteData.notAsked();
    this.selected = null; // Object - { name; createTime; lastModified; }
    this.selectedOpen = false;
    this.objects = {}; // ObjectName -> RemoteData.payload -> plot
    this._extraObjectData = {};

    this.searchInput = ''; // String - content of input search
    this.searchResult = []; // Array<object> - result list of search
    this.sortBy = {
      field: 'name',
      title: 'Name',
      order: 1,
      icon: iconCaretTop(),
    };

    this.tree = new ObjectTree('database');
    this.tree.bubbleTo(this);

    this.queryingObjects = false;
    this.scrollTop = 0;
    this.scrollHeight = 0;

    this._initializeLeftPanelWidth();
  }

  /**
   * Initialize left panel width from local storage or set to default
   * @returns {undefined}
   */
  _initializeLeftPanelWidth() {
    const DEFAULT_PANEL_WIDTH = 50;
    this.leftPanelWidthStorage = new BrowserStorage(StorageKeysEnum.OBJECT_VIEW_LEFT_PANEL_WIDTH);
    const storedWidth = this.leftPanelWidthStorage.getLocalItem(this.model.session.personid.toString());
    this.leftPanelWidthPercent = storedWidth ?? DEFAULT_PANEL_WIDTH;
  }

  /**
   * Set the left panel width percentage
   * @param {number} widthPercent - width percentage of the left panel
   * @returns {undefined}
   */
  setLeftPanelWidthPercent(widthPercent) {
    this.leftPanelWidthStorage.setLocalItem(this.model.session.personid.toString(), widthPercent);
    this.leftPanelWidthPercent = widthPercent;
    this.notify();
  }

  /**
   * Set searched items table UI sizes to allow virtual scrolling
   * @param {number} scrollTop - position of the user's scroll cursor
   * @param {number} scrollHeight - height of table's viewport (not content height which is higher)
   * @returns {undefined}
   */
  setScrollTop(scrollTop, scrollHeight) {
    this.scrollTop = scrollTop;
    this.scrollHeight = scrollHeight;
    this.notify();
  }

  /**
   * Method to toggle the box displaying more information about the histogram
   * @param {string} objectName - object for which the toggle should be done
   * @returns {undefined}
   */
  toggleInfoArea(objectName) {
    this.selectedOpen = !this.selectedOpen;
    this.notify();
    if (objectName) {
      if (!this.list) {
        this.selected = { name: objectName };
      } else if (this.selectedOpen && this.list
        && (this.selected && !this.selected.lastModified
          || !this.selected)
      ) {
        this.selected = this.list.find((object) => object.name === objectName);
      }
    }
    this.notify();
  }

  /**
   * Computes the final list of objects to be seen by user depending on search input from user
   * If any of those changes, this method should be called to update the outputs.
   * @returns {undefined}
   */
  _computeFilters() {
    if (this.searchInput) {
      const listSource = this.list || []; // With fallback
      const fuzzyRegex = new RegExp(this.searchInput, 'i');
      this.searchResult = listSource.filter((item) => fuzzyRegex.test(item.name));
    } else {
      this.searchResult = [];
    }
  }

  /**
   * Method to sort a list of JSON objects by one of its fields
   * @param {Array<JSON>} listSource - list of objects to be sorted
   * @param {string} field - filed by which the sort should be done
   * @param {number} order - acending (1) or decending (-1)
   * @returns {undefined}
   */
  sortListByField(listSource, field, order) {
    listSource?.sort((a, b) => typeof a[field] === 'string' ?
      this._compareStrings(a[field], b[field], order) :
      this._compareNumbers(a[field], b[field], order));
  }

  /**
   * Helper method for sortListByField for sorting strings
   * @param {string} a - first string to be sorted
   * @param {string} b - second string to be sorted
   * @param {number} order - acending (1) or decending (-1)
   * @returns {undefined}
   */
  _compareStrings(a, b, order) {
    return a.toUpperCase().localeCompare(b.toUpperCase()) * order;
  }

  /**
   * Helper method for sortListByField for sorting numbers
   * @param {number} a - first number to be sorted
   * @param {number} b - second number to be sorted
   * @param {number} order - acending (1) or decending (-1)
   * @returns {undefined}
   */
  _compareNumbers(a, b, order) {
    return (a - b) * order;
  }

  /**
   * Sort Tree of Objects by specified field and order
   * @param {string} title - title of the tree to be sorted
   * @param {string} field - field by which the sort operation should happen
   * @param {number} order {-1; 1}
   * @param {Function} icon - icon to be displayed based on sort order
   * @returns {undefined}
   */
  sortTree(title, field, order, icon) {
    this.sortListByField(this.currentList, field, order);
    this.tree.initTree('database');
    this.tree.addChildren(this.currentList);

    this._computeFilters();

    this.sortBy = { field, title, order, icon };
    this.notify();
  }

  /**
   * Checks if the object list needs to be refreshed.
   * @returns {Promise<{ refreshNeeded: boolean, data: object | null }>}
   * whether a refresh is needed and the fetched data
   */
  checkIfListHasToBeRefreshed() {
    const fetchFn = async () => await this.model.services.object.getObjects(true);
    const validateFn = (result) => result.isSuccess() && result.payload.paths?.length !== this.list?.length;
    return this.model.filterModel.refreshCheck(fetchFn, validateFn);
  }

  /**
   * Ask server for all available objects, fills `tree` of objects
   * @returns {undefined}
   */
  async loadList() {
    const { refreshNeeded, data } = await this.checkIfListHasToBeRefreshed();
    if (!refreshNeeded) {
      this.notify();
      return;
    }
    this.objectsRemote = RemoteData.loading();
    this.notify();
    this.queryingObjects = true;
    let offlineObjects = [];
    const result = data ?? await this.model.services.object.getObjects(this.model.filterModel.isRunModeActivated);

    if (result.isSuccess()) {
      offlineObjects = this.model.filterModel.isRunModeActivated ? result.payload.paths : result.payload;
    } else {
      const errorMessage =
        result?._error?.message || 'Failed to retrieve list of objects. Please contact an administrator';
      this.model.notification.show(errorMessage, 'danger', Infinity);
    }
    this.sortListByField(offlineObjects, this.sortBy.field, this.sortBy.order);
    this.list = offlineObjects;

    let treeState = null;
    let selectedObject = null;

    // save the state of the tree in run mode
    if (this.model.filterModel.isRunModeActivated) {
      treeState = this.saveTreeState();
      selectedObject = this.selected;
    }

    this.tree.initTree('database');
    this.tree.addChildren(offlineObjects);

    // restore tree state if in run mode
    if (this.model.filterModel.isRunModeActivated && treeState) {
      this.restoreTreeState(treeState);
    }

    this.currentList = offlineObjects;
    this.sortBy = {
      field: 'name',
      title: 'Name',
      order: 1,
      icon: iconCaretTop(),
    };
    this._computeFilters();

    // if w are in run mode and an object was opened
    if (this.model.filterModel.isRunModeActivated && selectedObject) {
      const foundObject = this.list.find((object) => object.name === selectedObject.name);
      if (foundObject) {
        this.selected = foundObject;
      }
    } else if (this.selected && !this.selected.lastModified) {
      this.selected = this.list.find((object) => object.name === this.selected.name);
    }
    this.queryingObjects = false;
    this.objectsRemote = RemoteData.success();
    this.notify();
  }

  /**
   * Load full content of an object in-memory
   * @param {string} objectName - e.g. /FULL/OBJECT/PATH
   * @param {number} timestamp - timestamp in ms
   * @param {string} id - id of object as per data storage
   * @returns {undefined}
   */
  async loadObjectByName(objectName, timestamp = undefined, id = undefined) {
    this.objects[objectName] = RemoteData.loading();
    this.notify();

    const obj =
      await this.model.services.object.getObjectByName(objectName, id, timestamp, this);

    // TODO Is it a TTree?
    if (obj.isSuccess()) {
      if (isObjectOfTypeChecker(obj.payload.qcObject.root)) {
        this.objects[objectName] = obj;
        this.notify();
      } else {
        // Link JSROOT methods to object. JSROOT.parse call was removed due to bug
        this.objects[objectName] = RemoteData.success(obj.payload);
        this.notify();
      }
      if (this.selected) {
        this.selected.version = !timestamp
          ? parseInt(this.objects[objectName].payload.versions[0].createdAt, 10)
          : parseInt(timestamp, 10);
      }
    } else {
      this.objects[objectName] = obj;
    }
    this.notify();
  }

  /**
   * Load objects provided by a list of paths
   * @param {Array.<string>} objectsName - e.g. /FULL/OBJECT/PATH
   * @returns {undefined}
   */
  async loadObjects(objectsName) {
    this.objectsRemote = RemoteData.loading();
    this.objects = {}; // Remove any in-memory loaded objects
    this._extraObjectData = {}; // Remove any in-memory extra object data
    this.model.services.object.objectsLoadedMap = {}; // TODO not here
    this.notify();
    if (!objectsName || !objectsName.length) {
      this.objectsRemote = RemoteData.success();
      this.notify();
      return;
    }
    await this.refreshObjects(objectsName);
    this.objectsRemote = RemoteData.success();
    this.notify();
  }

  /**
   * Refreshes currently displayed objects
   * @param {Array.<string>} objectsName - e.g. /FULL/OBJECT/PATH
   * @returns {undefined}
   */
  async refreshObjects(objectsName) {
    await Promise.allSettled(objectsName.map(async (objectName) => {
      let fetchedData = null;
      if (this.objects[objectName]?.isSuccess() && this.objects[objectName]?.payload?.name) {
        const context = { objectName };
        const { refreshNeeded, data } = await this.checkIfRefreshObject(this.objects[objectName].payload, context);
        fetchedData = data;
        if (!refreshNeeded) {
          return;
        }
      }

      this.objects[objectName] = RemoteData.Loading();
      this.notify();

      this.objects[objectName] =
    fetchedData ?? await this.model.services.object.getObjectByName(objectName, undefined, undefined, this);

      this.notify();
    }));
  }

  /**
   * Indicate that the object loaded is wrong. Used after trying to print it with jsroot
   * @param {string} name - name of the object
   * @param {object} details - object containing detail information for invalidation
   * @returns {undefined}
   */
  invalidObject(name, details) {
    this.objects[name] = updateWithPlotErrorOnQcRemoteData(this.objects[name], details);
    this.notify();
  }

  /**
   * Set the current selected object by user
   * Search within `currentList`;
   * @param {QCObject} object - object to be selected and loaded
   * @param {object} [preloadedData] - optional object data already fetched
   *  @returns {undefined}
   */
  async select(object = undefined, preloadedData = null) {
    if (!object) {
      this.selected = undefined;
      this.notify();
      return;
    }

    let foundObject = this.currentList.find((obj) => obj.name === object.name);

    if (foundObject && this.list && this.list.length > 0) {
      foundObject = this.list.find((obj) => obj.name === object.name);
    }

    this.selected = foundObject || object;
    setBrowserTabTitle(this.selected.name);
    if (preloadedData) {
      this.objects[this.selected.name] = RemoteData.success(preloadedData);
    } else {
      await this.loadObjectByName(this.selected.name);
    }
    this.notify();
  }

  /**
   * Set the current user search string and compute next visible list of objects
   * @param {string} searchInput - user input by which the sort should be done
   * @returns {undefined}
   */
  search(searchInput) {
    this.searchInput = searchInput;
    this._computeFilters();

    this.sortListByField(this.searchResult, this.sortBy.field, this.sortBy.order);
    this.notify();
  }

  /**
   * Method to generate drawing options based on where in the application the plot is displayed
   * @param {TabObject} tabObject - tab dto representation
   * @param {RemoteData<{king: string, payload: QcObject}>} objectRemoteData - QC object within RemoteData type
   * @returns {Array<string>} - list of drawing options
   */
  generateDrawingOptions(tabObject, objectRemoteData) {
    let objectOptionList = [];
    let drawingOptions = [];

    const { qcObject } = objectRemoteData.payload;
    if (qcObject.fOption) {
      objectOptionList = qcObject.fOption.split(' ');
    }

    if (qcObject.drawOptions) {
      objectOptionList = [...objectOptionList, ...qcObject.drawOptions];
    }
    if (qcObject.displayHints) {
      objectOptionList = [...objectOptionList, ...qcObject.displayHints];
    }
    if (tabObject.options) {
      objectOptionList = objectOptionList.concat(tabObject.options);
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
        // Merge all options or ignore if in layout view and user specifies so
        break;
      }
      case 'objectView': {
        const { layoutId } = this.model.router.params;
        const { objectId } = this.model.router.params;

        if (!layoutId || !objectId) {
          // Object opened from tree view -> use only its own options
          drawingOptions = JSON.parse(JSON.stringify(objectOptionList));
        } else {
          // Object opened from layout view -> use the layout/tab configuration
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
   * @param {object} layout - layout dto representation
   * @param {string} objectId - id of the object within the layout
   * @returns {string} - object name queried by id
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
   * @param {string} objectName - name of the object
   * @returns {string|'Loading'|'-'} - date of last modified
   */
  getLastModifiedByName(objectName) {
    const objMap = this.model.services.object.objectsLoadedMap;
    if (objMap[objectName]) {
      if (objMap[objectName].isSuccess()) {
        const date = objMap[objectName].payload.lastModified;
        return prettyFormatDate(date);
      } else if (objMap[objectName].isLoading()) {
        return 'Loading...';
      }
    }
    return '-';
  }

  /**
   * Method to search for the object which info was requested for and return runNumber
   * @param {string} objectName - name of the object in question
   * @returns {string|'Loading'|'-'} - RunNumber of the object
   */
  getRunNumberByName(objectName) {
    const objMap = this.model.services.object.objectsLoadedMap;
    if (objMap[objectName]) {
      if (objMap[objectName].isSuccess()) {
        return objMap[objectName].payload.runNumber || '-';
      } else if (objMap[objectName].isLoading()) {
        return 'Loading...';
      }
    }
    return '-';
  }

  /**
   * Return the list of object timestamps
   * @param {string} name - name of the object to be retrieving the list
   * @returns {Array<number>} - list of timestamps for queried object
   */
  getObjectVersions(name) {
    if (this.objects[name] && this.objects[name].kind === 'Success') {
      return this.objects[name].payload.versions;
    } else {
      return [];
    }
  }

  /**
   * Save the current state of the tree
   * @returns {object} - Map of path strings to their open state
   */
  saveTreeState() {
    const state = {};

    /**
     * Save the state of each node in the tree
     * @param {object} node - The tree node to save state for
     * @returns {undefined}
     */
    function saveNodeState(node) {
      if (node.pathString) {
        state[node.pathString] = node.open;
      }
      for (let i = 0; i < node.children.length; i++) {
        saveNodeState(node.children[i]);
      }
    }
    saveNodeState(this.tree);
    return state;
  }

  /**
   * Restore the tree state from a previously saved state
   * @param {object} state - Map of path strings to their open state
   * @returns {undefined}
   */
  restoreTreeState(state) {
    /**
     * Restore the state of each node in the tree
     * @param {object} node - The tree node to save state for
     * @returns {undefined}
     */
    function restoreNodeState(node) {
      if (node.pathString && state[node.pathString] !== undefined) {
        node.open = state[node.pathString];
      }
      for (let i = 0; i < node.children.length; i++) {
        restoreNodeState(node.children[i]);
      }
    };

    restoreNodeState(this.tree);
  }

  /**
   * Checks if the given object needs to be refreshed by comparing its ID
   * @param {object} object - The object to check for refresh.
   * @param {string} object.name - The name of the object to look up.
   * @param {string|number} object.id - The current ID of the object being validated.
   * @param {object} context - Additional context to determine fetch method
   * @param {string} context.objectName - Object name from URL params
   * @param {string} context.objectId - Object ID from URL params
   * @returns {Promise<boolean,RemoteData>} A promise that resolves to `true` if the object should be refreshed
   */
  async checkIfRefreshObject(object, context = {}) {
    const { objectName, objectId } = context;

    const fetchFn = async () => {
      if (objectId) {
        return await this.model.services.object.getObjectById(
          objectId,
          undefined,
          undefined,
          this,
        );
      } else {
        return await this.model.services.object.getObjectByName(
          objectName || object.name,
          undefined,
          undefined,
          this,
        );
      }
    };

    const validateFn = (result) =>
      result.isSuccess() && result.payload.id !== object.id;
    return this.model.filterModel.refreshCheck(fetchFn, validateFn);
  }

  /**
   * Function that reloads the object list with filters applied
   * @returns {undefined}
   */
  async triggerFilter() {
    if (!this.model.filterModel.isRunModeActivated || !this.model.filterModel.runsModeInterval) {
      this.selected = null;
    }
    if (this.selected && this.selected.name) {
      const context = { objectName: this.selected.name };
      const { refreshNeeded, data } =
        await this.checkIfRefreshObject(this.objects[this.selected.name].payload, context);
      if (refreshNeeded && data?.payload) {
        this.select({ name: this.selected.name }, data.payload);
      }
    }
    this.loadList();
  }

  /**
   * Returns the extra data associated with a given object name.
   * @param {string} objectName The name of the object whose extra data should be retrieved.
   * @returns {object | undefined} The extra data associated with the given object name, or undefined if none exists.
   */
  getExtraObjectData(objectName) {
    return this._extraObjectData[objectName];
  }

  /**
   * Appends extra data to an existing object entry.
   * Existing keys are preserved unless overwritten by the provided data. If no data exists, a new entry is created.
   * @param {string} objectName The name of the object to which extra data should be appended.
   * @param {object} data The extra data to merge into the existing object data.
   * @returns {undefined}
   */
  appendExtraObjectData(objectName, data) {
    this._extraObjectData[objectName] = { ...this._extraObjectData[objectName] ?? {}, ...data };
    // debounce notify by 1ms
    simpleDebouncer('QCObject.appendExtraObjectData', () => this.notify(), 1);
  }

  /**
   * Sets (overwrites) the extra data for a given object name.
   * Any previously stored data for the object is replaced entirely.
   * @param {string} objectName The name of the object whose extra data should be set.
   * @param {object | undefined} data The extra data to associate with the object.
   * @returns {undefined}
   */
  setExtraObjectData(objectName, data) {
    this._extraObjectData[objectName] = data;
    // debounce notify by 1ms
    simpleDebouncer('QCObject.setExtraObjectData', () => this.notify(), 1);
  }

  /**
   * Clears all stored extra object data.
   * After calling this method, no extra data will be associated with any object name.
   * @returns {undefined}
   */
  clearAllExtraObjectData() {
    this._extraObjectData = {};
    this.notify();
  }
}
