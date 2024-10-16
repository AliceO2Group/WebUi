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

import { Observable, RemoteData } from '/js/src/index.js';

import GridList from './Grid.js';
import LayoutUtils from './LayoutUtils.js';
import { objectId, clone, setBrowserTabTitle } from '../common/utils.js';
import { assertTabObject, assertLayout } from '../common/Types.js';
import { buildQueryParametersString } from '../common/buildQueryParametersString.js';

const CCDB_QUERY_PARAMS = ['PeriodName', 'PassName', 'RunNumber', 'RunType'];

/**
 * Model namespace with all requests to load or create layouts, compute their position on a grid,
 * and search them.
 */
export default class Layout extends Observable {
  /**
   * Initialize with empty values
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;

    this.item = null; // Current selected layout containing an array of tabs

    this.tab = null; // Pointer to a tab from `item`
    this._tabIndex = 0; // Index of the cu displayed tab
    this.tabInterval = undefined; // JS Interval to change currently displayed tab

    this.newJSON = undefined;
    this.updatedJSON = undefined;

    this.requestedLayout = RemoteData.notAsked();

    this.searchInput = '';

    this.editEnabled = false; // Activate UI for adding, dragging and deleting tabObjects inside the current tab
    this.editingTabObject = null; // Pointer to a tabObject being modified
    this.editOriginalClone = null; // Contains a deep clone of item before editing

    this.editMenuOpen = false;

    // https://github.com/hootsuite/grid
    this.gridListSize = 3;

    this.gridList = new GridList([], {
      direction: 'vertical',
      lanes: this.gridListSize,
    });
    this.cellHeight = 100 / this.gridListSize * 0.95; // %, put some margin at bottom to see below
    this.cellWidth = 100 / this.gridListSize; // %
    // GridList.grid.length: integer, number of rows

    this.filter = {};
  }

  /**
   * Load data about a layout by its id within a RemoteData object
   * Used within ObjectView page hence updating selected object as well
   * @param {string} layoutId - id of the layout to be loaded
   * @returns {Promise} - whether retrieval of layout was success
   */
  async getLayoutById(layoutId) {
    this.requestedLayout = RemoteData.loading();
    this.notify();
    this.requestedLayout = await this.model.services.layout.getLayoutById(layoutId);
    this.notify();

    if (!this.requestedLayout.isSuccess()) {
      this.model.notification.show('Unable to load requested layout.', 'danger', Infinity);
    } else {
      if (this.model.router.params.objectId) {
        await this.model.object.select({
          name: this.model.object.getObjectNameByIdFromLayout(
            this.requestedLayout.payload,
            this.model.router.params.objectId,
          ),
        });
      }
    }
    this.notify();
  }

  /**
   * Load data about a layouts by its id
   * @param {string} layoutId - id of the layout to be loaded
   * @param {string} [tabName] - name of the tab that should be loaded
   * @returns {Promise} - whether retrieval of layout was success
   */
  async loadItem(layoutId, tabName) {
    this.item = null;
    if (!layoutId) {
      this.model.notification.show('Unable to load layout, it might have been deleted.', 'warning');
      this.model.router.go('?page=layouts');
    } else {
      const result = await this.model.services.layout.getLayoutById(layoutId);

      if (result.isSuccess()) {
        this.item = assertLayout(result.payload);
        this.item.autoTabChange = this.item.autoTabChange || 0;
        this.setFilterFromURL();
        let tabIndex = this.item.tabs
          .findIndex((tab) => tab.name?.toLocaleUpperCase() === tabName?.toLocaleUpperCase());
        if (tabIndex < 0) {
          tabIndex = this.item.tabs
            .findIndex((tab) => tabName?.toLocaleUpperCase().startsWith(tab.name?.toLocaleUpperCase()));
        }
        this.selectTab(tabIndex > -1 ? tabIndex : 0);
        this.setTabInterval(this.item.autoTabChange);
        this.notify();
      } else {
        this.model.notification.show('Unable to load layout, it might have been deleted.', 'warning');
        this.model.router.go('?page=layouts');
      }
    }
  }

  /**
   * Look for parameters used for filtering in URL and apply them in the layout if it exists
   * @returns {undefined}
   */
  setFilterFromURL() {
    const parameters = this.model.router.params;
    CCDB_QUERY_PARAMS.forEach((filterKey) => {
      if (parameters[filterKey]) {
        this.filter[filterKey] = decodeURI(parameters[filterKey]);
      }
    });
    this.notify();
  }

  /**
   * When the user updates the displayed Objects, the filters should be placed in the URL as well
   * @param {boolean} isSilent - whether the route should be silent or not
   * @returns {undefined}
   */
  setFilterToURL(isSilent = true) {
    const parameters = this.model.router.params;

    CCDB_QUERY_PARAMS.forEach((filterKey) => {
      if (!this.filter[filterKey] && this.filter[filterKey] !== 0) {
        delete parameters[filterKey];
      } else {
        parameters[filterKey] = encodeURI(this.filter[filterKey]);
      }
    });
    this.model.router.go(buildQueryParametersString(parameters, { }), true, isSilent);
  }

  /**
   * Set layout property to given value
   * @param {string} key - key of the property to be set
   * @param {object} value - value of the property to be set
   * @returns {undefined}
   */
  setLayoutProperty(key, value) {
    switch (key) {
      case 'autoTabChange':
        this.item[key] = value >= 10 ? value : 0;
        break;
      default:
        this.item[key] = value;
    }
    this.notify();
  }

  /**
   * Given a user input value as String, set it as potential imported layout value as JSON
   * @param {string} layout - JSON representation as string of a layout
   * @returns {undefined}
   */
  setImportValue(layout) {
    try {
      this.newJSON = JSON.parse(layout);
      this.model.services.layout.new = RemoteData.notAsked();
    } catch (error) {
      this.model.services.layout.new = RemoteData.failure(error);
    }
    this.notify();
  }

  /**
   * Reset import layout modal if user cancels the operation
   * @returns {undefined}
   */
  resetImport() {
    this.newJSON = undefined;
    this.model.services.layout.new = RemoteData.notAsked();
    this.model.isImportVisible = false;
  }

  /**
   * Create a new layout based on a given JSON skeleton through the import modal
   * If successful, go to its own page in edit mode afterward
   * @param {JSON} layout - skeleton of layout to be imported
   * @returns {undefined}
   */
  async newFromJson(layout) {
    layout = LayoutUtils.fromSkeleton(layout);
    layout.owner_id = this.model.session.personid;
    layout.owner_name = this.model.session.name;

    const result = await this.model.services.layout.createNewLayout(layout, this);

    if (result.isSuccess()) {
      this.resetImport();
      // Read the new layout created and edit it
      this.model.router.go(`?page=layoutShow&layoutId=${layout.id}&edit=true`, false, false);
      // Update user list in background
      this.model.services.layout.getLayoutsByUserId(this.model.session.personid);
    }
  }

  /**
   * Creates a new empty layout with a name, go to its own page in edit mode afterward
   * @param {string} layoutName - name of the new layout in process to be created
   * @returns {undefined}
   */
  async newItem(layoutName) {
    if (!layoutName) {
      this.model.notification.show('A new layout was not created due to invalid name', 'warning', 2000);
    } else {
      const layout = assertLayout({
        id: objectId(),
        name: layoutName,
        owner_id: this.model.session.personid,
        owner_name: this.model.session.name,
        description: '',
        displayTimestamp: false,
        autoTabChange: 0,
        tabs: [
          {
            id: objectId(),
            name: 'main',
            objects: [],
          },
        ],
      });

      const result = await this.model.services.layout.createNewLayout(layout);
      if (result.isFailure()) {
        this.model.notification.show(result.payload || 'Unable to create layout', 'danger', 2000);
        return;
      }

      // Read the new layout created and edit it
      this.model.router.go(`?page=layoutShow&layoutId=${layout.id}&edit=true`, false, false);

      // Update user list in background
      this.model.services.layout.getLayoutsByUserId(this.model.session.personid);
    }
  }

  /**
   * Delete current layout inside `item` from the server
   * @returns {undefined}
   */
  async deleteItem() {
    if (!this.item) {
      throw new Error('no layout to delete');
    }
    const layoutRemovalRemoteData = await this.model.services.layout.removeLayoutById(this.item.id);
    if (layoutRemovalRemoteData.isSuccess()) {
      this.model.notification.show(`Layout "${this.item.name}" has been deleted.`, 'success', 1500);
      this.model.router.go('?page=layouts');
      this.model.services.layout.getLayoutsByUserId(this.model.session.personid);
      this.editEnabled = false;
    } else {
      this.model.notification.show(layoutRemovalRemoteData.payload, 'danger', 1500);
    }
    this.notify();
  }

  /**
   * Save current `item` layout to server
   * @returns {undefined}
   */
  async saveItem() {
    if (!this.item) {
      throw new Error('no layout to save');
    }
    const result = await this.model.services.layout.saveLayout(this.item);
    if (result.isSuccess()) {
      this.model.notification.show(`Layout "${this.item.name}" has been saved successfully.`, 'success');
    } else {
      this.model.notification.show(result.payload, 'danger');
    }
    this.notify();
  }

  /**
   * Given an ID and new value for official status, update it accordingly
   * @param {string} id - of layout to modify
   * @param {boolean} isOfficial - new value to set
   * @returns {void}
   */
  async toggleOfficial(id, isOfficial) {
    await this.model.services.layout.patchLayout(id, { isOfficial });
    await this.model.services.layout.getLayouts(this);
    await this.model.services.layout.getLayoutsByUserId(this.model.session.personid, this);
    this.model.notify();
  }

  /**
   * Toggle edit menu dropdown
   * @returns {undefined}
   */
  async toggleEditMenu() {
    this.editMenuOpen = !this.editMenuOpen;
    this.model.notify();
  }

  /**
   * Method to allow more than 3x3 grid
   * @param {string} value - of grid resize
   * @returns {undefined}
   */
  resizeGridByXY(value) {
    this.gridListSize = parseInt(value, 10);
    this.cellHeight = 100 / this.gridListSize * 0.95; // %, put some margin at bottom to see below
    this.cellWidth = 100 / this.gridListSize; // %
    this.gridList.resizeGrid(this.gridListSize);
    this.tab.columns = this.gridListSize;
    this.tab.objects.forEach((object) => {
      if (object.w > this.tab.columns) {
        object.w = this.tab.columns;
        object.h = this.tab.columns;
      }
    });
    this.notify();
  }

  /**
   * Compute grid positions of the current tab selected
   * @returns {undefined}
   */
  sortObjectsOfCurrentTab() {
    this.gridList.items = this.tab.objects;
    this.gridList.resizeGrid(this.gridListSize);
  }

  /**
   * Select a tab of the current layout `item`
   * @param {number} index - index of array `item.tabs`
   * @returns {undefined}
   */
  selectTab(index) {
    const tabName = this.item.tabs[index].name;
    const parameters = this.model.router.params;

    setBrowserTabTitle(`${this.item.name}/${tabName}`);
    this.model.router.go(buildQueryParametersString(parameters, { tab: tabName }), true, true);

    this.setFilterFromURL();
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }
    this.tab = this.item.tabs[index];
    this._tabIndex = index;
    this.model.object.loadObjects(this.tab.objects.map((object) => object.name), this.filter);
    const { columns } = this.item.tabs[index];
    if (columns > 0) {
      this.resizeGridByXY(columns);
    } else {
      this.tab.columns = 3; // Default
      this.resizeGridByXY(3);
    }
    this.sortObjectsOfCurrentTab();
    this.notify();
  }

  /**
   * Delete a tab by index from the current selected layout `item`
   * @param {number} index - index of array `item.tabs`
   * @returns {undefined}
   */
  deleteTab(index) {
    if (this.item.tabs.length <= 1) {
      this.model.notification.show('Please, add another tab before deleting the last one', 'primary');
      return;
    }

    if (!confirm('Are you sure to delete this tab?')) {
      return;
    }

    // Impossible normally
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }

    this.item.tabs.splice(index, 1);
    this.notify();
  }

  /**
   * Rename tab of the current selected layout `item`
   * @param {index} index - index of array `item.tabs`
   * @param {string} name - new name for the tab to be renamed
   * @returns {undefined}
   * @throws {Error}
   */
  renameTab(index, name) {
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }

    this.item.tabs[index].name = name;
    this.notify();
  }

  /**
   * Creates a new tab inside the current layout `item`
   * @param {string} name - name of the tab to be added
   * @returns {undefined}
   * @throws {Error}
   */
  newTab(name) {
    if (!name) {
      throw new Error('tab name is required');
    }

    this.item.tabs.push({
      id: objectId(),
      name: name,
      objects: [],
    });
    this.notify();
  }

  /**
   * Set user's input for search and use a fuzzy algo to filter list of layouts.
   * Fuzzy allows missing chars "aaa" can find "a/a/a" or "aa/a/bbbbb"
   * @param {string} searchInput - string input from the user to search by
   * @returns {undefined}
   */
  search(searchInput) {
    this.searchInput = searchInput;
    this.model.folder.map.forEach((folder) => {
      folder.searchInput = new RegExp(searchInput, 'i');
    });
    this.notify();
  }

  /**
   * Creates a deep clone of current layout `item` inside `editOriginalClone` to edit it without side effect.
   * @returns {undefined}
   */
  edit() {
    this.model.services.object.listObjects();

    if (!this.item) {
      throw new Error('An item should be loaded before editing it');
    }
    this.setTabInterval(0);
    this.editEnabled = true;
    this.editOriginalClone = JSON.parse(JSON.stringify(this.item));
    this.editingTabObject = null;
    window.dispatchEvent(new Event('resize'));

    this.notify();
  }

  /**
   * Ends editing and send back to server the new version of the current layout
   * @returns {undefined}
   */
  save() {
    this.setTabInterval(this.item.autoTabChange);
    this.editEnabled = false;
    this.editingTabObject = null;
    this.saveItem();
    this.model.services.layout.getLayoutsByUserId(this.model.session.personid);
    this.notify();
  }

  /**
   * Ends editing and replaces the current layout by the original that was backed-up before editing
   * @returns {undefined}
   */
  cancelEdit() {
    this.editEnabled = false;
    this.editingTabObject = null;
    this.item = this.editOriginalClone;
    this.selectTab(this._tabIndex);
    this.notify();
  }

  /**
   * Add a new object chart
   * @param {string} objectName - name of object like a/b/c
   * @returns {object} the new tabObject created
   */
  addItem(objectName) {
    const newTabObject = assertTabObject({
      id: objectId(),
      x: 0,
      y: 100, // Place it at the end first
      h: 1,
      w: 1,
      name: objectName,
      options: [],
    });
    this.tab.objects.push(newTabObject);
    this.sortObjectsOfCurrentTab();
    this.notify();
    return newTabObject;
  }

  /**
   * Track the item to be moved by drag&drop.
   * Also save the current order of items as the 'initial order'.
   * @param {TabObject} tabObject - the moving item
   * @returns {undefined}
   */
  moveTabObjectStart(tabObject) {
    this.tabObjectMoving = tabObject;
    this.originalItems = clone(this.tab.objects);
    this.notify();
  }

  /**
   * Stop to track the drag of 'moving item'
   * @returns {undefined}
   */
  moveTabObjectStop() {
    this.tabObjectMoving = null;
    this.notify();
  }

  /**
   * Set position of 'moving item' to `newX` and `newY`.
   * Items are then reordered so avoid collapses based on 'initial order',
   * this avoids to move other items twice from their initial position.
   * @param {number} newX - x position starting left top
   * @param {number} newY - y position starting left top
   * @returns {undefined}
   */
  moveTabObjectToPosition(newX, newY) {
    if (!this.tabObjectMoving) {
      return;
    }

    // Restoration of positions by mutating so we keep references
    this.tab.objects.forEach((obj) => {
      const originalClone = this.originalItems.find((tabObject) => tabObject.id === obj.id);
      obj.x = originalClone.x;
      obj.y = originalClone.y;
      obj.h = originalClone.h;
      obj.w = originalClone.w;
    });

    // Use GridList to move the moving item from initial position to the new one
    this.gridList.moveItemToPosition(this.tabObjectMoving, [newX, newY]);

    this.notify();
  }

  /**
   * Set size of tabObject and compute new positions in the grid
   * @param {object} tabObject - tab dto representation
   * @param {number} w - width
   * @param {number} h - height
   * @returns {undefined}
   */
  resizeTabObject(tabObject, w, h) {
    this.gridList.resizeItem(tabObject, { w, h });
    this.notify();
  }

  /**
   * Toggle a jsroot option of a tabObject
   * @param {object} tabObject - tab dto representation
   * @param {string} option - option for which to toggle
   * @returns {undefined}
   */
  toggleTabObjectOption(tabObject, option) {
    const index = tabObject.options.indexOf(option);
    if (index >= 0) {
      tabObject.options.splice(index, 1);
    } else {
      tabObject.options.push(option);
    }
    this.notify();
  }

  /**
   * Method to toggle displaying default options
   * If field does not exist in tabObject, it will be added
   * @param {object} tabObject - tab dto representation
   * @returns {undefined}
   */
  toggleDefaultOptions(tabObject) {
    if (tabObject.ignoreDefaults) {
      tabObject.ignoreDefaults = false;
    } else {
      tabObject.ignoreDefaults = true;
    }
    this.notify();
  }

  /**
   * Edit a tabObject from current tab from current layout, sidebar will show its properties
   * @param {object} tabObject - tab dto representation
   * @returns {undefined}
   */
  editTabObject(tabObject) {
    this.editingTabObject = tabObject;
    this.notify();
  }

  /**
   * Delete a tabObject from current tab from current layout
   * @param {object} tabObject - tab dto representation
   * @returns {undefined}
   */
  deleteTabObject(tabObject) {
    if (tabObject === this.editingTabObject) {
      this.editingTabObject = null;
    }
    this.tab.objects = this.tab.objects.filter((item) => item.id !== tabObject.id);
    this.sortObjectsOfCurrentTab();
    this.notify();
  }

  /**
   * Method to duplicate an existing layout
   * @param {string} layoutName - name of the new layout tha tis being created
   * @returns {Promise} - whether duplication was successful
   */
  async duplicate(layoutName) {
    if (!layoutName) {
      this.model.notification.show('Layout was not duplicated due to invalid/missing new name', 'warning', 2000);
      return;
    }
    const itemToDuplicate = clone(this.item);
    // Create tabs for new layout
    const tabs = [];

    itemToDuplicate.tabs.forEach((tab) => {
      const duplicatedTab = {
        id: objectId(),
        name: tab.name,
        objects: clone(tab.objects),
        columns: tab.columns,
      };
      tabs.push(duplicatedTab);
    });

    // Create new duplicated layout
    const layout = assertLayout({
      id: objectId(),
      name: layoutName,
      owner_id: this.model.session.personid,
      owner_name: this.model.session.name,
      tabs: tabs,
    });

    const result = await this.model.services.layout.createNewLayout(layout);
    // TODO Newly created item should be sent back by the API. This will prevent having to reload the item again below
    if (result.isSuccess()) {
      await this.loadItem(layout.id);
      this.model.notification.show(`Layout "${itemToDuplicate.name}" ` +
        `has been successfully duplicated into "${this.item.name}".`, 'success');
      this.model.router.go(`?page=layoutShow&layoutId=${layout.id}`, false, false);
      this.model.services.layout.getLayoutsByUserId(this.model.session.personid);
    } else {
      this.model.notification.show(`Layout "${itemToDuplicate.name}" has not been duplicated.`, 'danger');
    }
  }

  /**
   * Method to check if passed layout contains any objects in online mode
   * @param {Layout} layout - layout dto representation
   * @returns {boolean} - whether there are online objects
   */
  doesLayoutContainOnlineObjects(layout) {
    if (layout && layout.tabs && layout.tabs.length > 0) {
      return layout.tabs
        .map((tab) => tab.objects)
        .some((objects) =>
          objects.map((object) => object.name)
            .some((name) => this.model.object.isObjectInOnlineList(name)));
    }
    return false;
  }

  /**
   * Getters / Setters
   */

  /**
   * Sends back the currently displayed tab index
   * @returns {number} - tab index
   */
  get tabIndex() {
    return this._tabIndex;
  }

  /**
   * Updates the index of the currently displayed tab
   * Will default to 0 if the received index is greater than the current possibilities
   * @param {number} index - new value of tab index
   * @returns {undefined}
   */
  set tabIndex(index) {
    this._tabIndex = index >= this.item.tabs.length ? 0 : index;
  }

  /**
   * Sets an interval to automatically change current tab selection based on the passed time in seconds
   * If time is < 10, no interval will be set
   * @param {number} time - seconds on how often the tab should be changed
   * @returns {undefined}
   */
  setTabInterval(time) {
    if (time >= 10) {
      this.tabInterval = setInterval(() => {
        this._tabIndex = this._tabIndex + 1 >= this.item.tabs.length ? 0 : this._tabIndex + 1;
        this.selectTab(this._tabIndex);
      }, time * 1000);
    } else {
      clearInterval(this.tabInterval);
      this.selectTab(this._tabIndex);
    }
  }

  /**
   * Returns the updated layout in a formatted JSON string.
   *
   * @returns {string} The updated JSON string representing the layout.
   */
  getUpdatedLayout() {
    if (!this.updatedJSON) {
      this.updatedJSON = LayoutUtils.toSkeleton(this.item);
    }
    return this.updatedJSON;
  }

  /**
   * Validates the provided layout and updates the layout state accordingly.
   * @param {string} newLayout - The layout to check.
   */
  checkLayoutToUpdate(newLayout) {
    try {
      const newJSON = JSON.parse(newLayout);
      this.checkForManualIdEntry(newJSON);
      this.model.services.layout.update = RemoteData.notAsked();
    } catch (error) {
      this.model.services.layout.update = RemoteData.failure(error.message || error);
    }
    this.updatedJSON = newLayout;
    this.notify();
  }

  /**
   * Checks that user don't enter the ID
   * @param {object} layoutJSON layout entered by the user in the box
   */
  checkForManualIdEntry(layoutJSON) {
    if (Object.keys(layoutJSON).includes('id')) {
      throw new Error('Error: Manual entry of an ID is not allowed, as it is automatically assigned by the system.');
    }
  }

  /**
   * Updates the layout by parsing the updated JSON and saving the layout state.
   */
  updateLayout() {
    try {
      this.item = this.getUpdatedItem();
      this.saveUpdatedItem();
    } catch (error) {
      this.changeUpdateStatus(RemoteData.failure(error.message || error));
    }
    this.notify();
  }

  /**
   * Merges skeleton to the layout
   *
   * @returns {object} item updated with user changes
   */
  getUpdatedItem() {
    const updatedLayout = LayoutUtils.fromSkeleton({
      ...this.item,
      ...JSON.parse(this.updatedJSON),
    });
    return {
      ...updatedLayout,
      id: this.item.id,
    };
  }

  /**
   * Saves the updated item and manages the update status.
   */
  saveUpdatedItem() {
    this.changeUpdateStatus(RemoteData.Loading());
    this.save();
    this.updatedJSON = undefined;
    this.changeUpdateStatus(RemoteData.Success());
    this.toggleUpdatePanel();
  }

  /**
   * Sets the status of the layout update
   *
   * @param {RemoteData} status new layout update status
   */
  changeUpdateStatus(status) {
    this.model.services.update = status;
  }

  /**
   * Toggles whether the layout update panel should be displayed or not
   */
  toggleUpdatePanel() {
    this.model.isUpdateVisible = !this.model.isUpdateVisible;
  }
}
