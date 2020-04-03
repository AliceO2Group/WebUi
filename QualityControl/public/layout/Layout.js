import {Observable, RemoteData} from '/js/src/index.js';

import GridList from './Grid.js';
import {objectId, clone} from '../common/utils.js';
import {assertTabObject, assertLayout, assertLayouts} from '../common/Types.js';

/**
 * Model namespace with all requests to load or create layouts, compute their position on a grid,
 * and search them.
 */
export default class Layout extends Observable {
  /**
   * Initialize with empty values
   * @param {Object} model
   */
  constructor(model) {
    super();

    this.model = model;

    this.list = null; // array of layouts
    this.item = null; // layout containing an array of tabs
    this.tab = null; // pointer to a tab from `item`

    this.myList = RemoteData.notAsked(); // array of layouts
    this.requestedLayout = RemoteData.notAsked();

    this.searchInput = '';
    this.searchResult = null; // null means no search, sub-array of `list`

    this.editEnabled = false; // activate UI for adding, dragging and deleting tabObjects inside the current tab
    this.editingTabObject = null; // pointer to a tabObject being modified

    this.editOriginalClone = null; // contains a deep clone of item before editing


    // https://github.com/hootsuite/grid
    this.gridListSize = 3;


    this.gridList = new GridList([], {
      direction: 'vertical',
      lanes: this.gridListSize
    });
    this.cellHeight = 100 / this.gridListSize * 0.95; // %, put some margin at bottom to see below
    this.cellWidth = 100 / this.gridListSize; // %
    // gridList.grid.length: integer, number of rows
  }

  /**
   * Load all available layouts shared by users inside `list`
   */
  async loadList() {
    const result = await this.model.layoutService.getLayouts();

    if (result.isSuccess()) {
      this.list = assertLayouts(result.payload);
      this.model.folder.map.get('All Layouts').list = this.list;
      this.notify();
    } else {
      this.model.notification.show(`Unable to load layouts.`, 'danger', Infinity);
      this.list = [];
    }
  }

  /**
   * Load layouts of current user inside `myList`
   */
  async loadMyList() {
    this.myList = RemoteData.loading();
    this.myList = await this.model.layoutService.getLayoutsByUserId(this.model.session.personid);
    if (!this.myList.isSuccess()) {
      this.model.notification.show(`Unable to load your personal layouts.`, 'danger', Infinity);
    }
    this.model.folder.map.get('My Layouts').list = this.myList.payload;
    this.notify();
  }

  /**
   * Load data about a layout by its id;
   * Used within ObjectView page hence updating selected object as well
   * @param {string} layoutId
   */
  async getLayoutById(layoutId) {
    this.requestedLayout = RemoteData.loading();
    this.notify();
    this.requestedLayout = await this.model.layoutService.getLayoutById(layoutId);
    if (!this.requestedLayout.isSuccess()) {
      this.model.notification.show(`Unable to load requested layout.`, 'danger', Infinity);
    } else {
      if (this.model.router.params.objectId) {
        this.model.object.select({
          name: this.model.object.getObjectNameByIdFromLayout(this.requestedLayout.payload,
            this.model.router.params.objectId)
        });
      }
    }
    this.notify();
  }

  /**
   * Load a single layout inside `item` and make its first tab selected
   * @param {number} layoutId
   */
  async loadItem(layoutId) {
    this.item = null;
    if (!layoutId) {
      this.model.notification.show(`Unable to load layout, it might have been deleted.`, 'warning');
      this.model.router.go(`?page=layouts`);
    } else {
      const result = await this.model.layoutService.getLayoutById(layoutId);

      if (result.isSuccess()) {
        this.item = assertLayout(result.payload);
        this.selectTab(0);
        this.notify();
      } else {
        this.model.notification.show(`Unable to load layout, it might have been deleted.`, 'warning');
        this.model.router.go(`?page=layouts`);
      }
    }
  }

  /**
   * Creates a new empty layout with a name, go to its own page in edit mode afterward
   * @param {string} layoutName
   */
  async newItem(layoutName) {
    if (!layoutName) {
      this.model.notification.show(`A new layout was not created due to invalid name`, 'warning');
    } else {
      const layout = assertLayout({
        id: objectId(),
        name: layoutName,
        owner_id: this.model.session.personid,
        owner_name: this.model.session.name,
        tabs: [{
          id: objectId(),
          name: 'main',
          objects: [],
        }]
      });

      const result = await this.model.layoutService.createNewLayout(layout);
      if (result.isFailure()) {
        this.model.notification.show(result.error || 'Unable to create layout', 'danger', Infinity);
        return;
      }

      // Read the new layout created and edit it
      this.model.router.go(`?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}&edit=true`, false, false);

      // Update user list in background
      this.loadMyList();
    }
  }

  /**
   * Delete current layout inside `item` from the server
   */
  async deleteItem() {
    if (!this.item) {
      throw new Error('no layout to delete');
    }
    await this.model.layoutService.removeLayoutById(this.item.id);

    this.model.notification.show(`Layout "${this.item.name}" has been deleted.`, 'success');
    this.model.router.go(`?page=layouts`);
    this.loadMyList();
    this.editEnabled = false;
    this.notify();
  }

  /**
   * Save current `item` layout to server
   */
  async saveItem() {
    if (!this.item) {
      throw new Error('no layout to save');
    }
    const result = await this.model.layoutService.saveLayout(this.item);
    if (result.isSuccess()) {
      this.model.notification.show(`Layout "${this.item.name}" has been saved successfully.`, 'success');
      this.model.router.go(`?page=layoutShow&layoutId=${this.item.id}&layoutName=${this.item.name}`, true, true);
      this.notify();
    } else {
      this.model.notification.show(`Layout "${this.item.name}" has not been saved.`, 'danger');
    }
  }

  /**
   * Ceva
   * @param {string} value
   */
  resizeGridByXY(value) {
    this.gridListSize = parseInt(value);
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
   */
  sortObjectsOfCurrentTab() {
    this.gridList.items = this.tab.objects;
    this.gridList.resizeGrid(this.gridListSize);
  }

  /**
   * Select a tab of the current layout `item`
   * @param {number} index - index of array `item.tabs`
   */
  selectTab(index) {
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }

    this.tab = this.item.tabs[index];
    const columns = this.item.tabs[index].columns;
    if (columns > 0) {
      this.resizeGridByXY(columns);
    } else {
      this.tab.columns = 3; // default
      this.resizeGridByXY(3);
    }
    this.sortObjectsOfCurrentTab();
    this.notify();
  }

  /**
   * Delete a tab by index from the current selected layout `item`
   * @param {number} index - index of array `item.tabs`
   */
  deleteTab(index) {
    if (this.item.tabs.length <= 1) {
      this.model.notification.show(`Please, add another tab before deleting the last one`, 'primary');
      return;
    }

    if (!confirm('Are you sure to delete this tab?')) {
      return;
    }

    // impossible normally
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }

    this.item.tabs.splice(index, 1);
    this.notify();
  }

  /**
   * Rename tab of the current selected layout `item`
   * @param {index} index - index of array `item.tabs`
   * @param {string} name
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
   * @param {string} name
   */
  newTab(name) {
    if (!name) {
      throw new Error(`tab name is required`);
    }

    this.item.tabs.push({
      id: objectId(),
      name: name,
      objects: []
    });
    this.notify();
  }

  /**
   * Set uset input for search and use a fuzzy algo to filter list of layouts.
   * Result is set inside `searchResult`.
   * Fuzzy allows missing chars "aaa" can find "a/a/a" or "aa/a/bbbbb"
   * @param {string} searchInput
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
   */
  edit() {
    if (!this.item) {
      throw new Error('An item should be loaded before editing it');
    }

    this.editEnabled = true;
    this.editOriginalClone = JSON.parse(JSON.stringify(this.item)); // deep clone
    this.editingTabObject = null;
    this.notify();
  }

  /**
   * Ends editing and send back to server the new version of the current layout
   */
  save() {
    this.editEnabled = false;
    this.editingTabObject = null;
    this.saveItem();
    this.loadMyList();
    this.notify();
  }

  /**
   * Ends editing and replaces the current layout by the original that was backed-up before editing
   */
  cancelEdit() {
    this.editEnabled = false;
    this.editingTabObject = null;
    this.item = this.editOriginalClone;
    this.selectTab(0);
    this.notify();
  }

  /**
   * Add a new object chart
   * @param {string} objectName - name of object like a/b/c
   * @return {Object} the new tabObject created
   */
  addItem(objectName) {
    const newTabObject = assertTabObject({
      id: objectId(),
      x: 0,
      y: 100, // place it at the end first
      h: 1,
      w: 1,
      name: objectName,
      options: []
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
   */
  moveTabObjectStart(tabObject) {
    this.tabObjectMoving = tabObject;
    this.originalItems = clone(this.tab.objects);
    this.notify();
  }

  /**
   * Stop to track the drag of 'moving item'
   */
  moveTabObjectStop() {
    this.tabObjectMoving = null;
    this.notify();
  }

  /**
   * Set position of 'moving item' to `newX` and `newY`.
   * Items are then reordered so avoid collapses based on 'initial order',
   * this avoids to move other items twice from their initial position.
   * @param {Number} newX - x position starting left top
   * @param {Number} newY - y position starting left top
   */
  moveTabObjectToPosition(newX, newY) {
    if (!this.tabObjectMoving) {
      return;
    }

    // restoration of positions by mutating so we keep references
    this.tab.objects.forEach((obj) => {
      const originalClone = this.originalItems.find((tabObject) => tabObject.id === obj.id);
      obj.x = originalClone.x;
      obj.y = originalClone.y;
      obj.h = originalClone.h;
      obj.w = originalClone.w;
    });

    // use GridList to move the moving item from initial position to the new one
    this.gridList.moveItemToPosition(this.tabObjectMoving, [newX, newY]);

    this.notify();
  }

  /**
   * Set size of tabObject and compute new positions in the grid
   * @param {Object} tabObject
   * @param {number} w - width
   * @param {number} h - height
   */
  resizeTabObject(tabObject, w, h) {
    this.gridList.resizeItem(tabObject, {w, h});
    this.notify();
  }

  /**
   * Toggle a jsroot option of a tabObject
   * @param {Object} tabObject
   * @param {string} option
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
   * @param {Object} tabObject
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
   * @param {Object} tabObject
   */
  editTabObject(tabObject) {
    this.editingTabObject = tabObject;
    this.notify();
  }

  /**
   * Delete a tabObject from current tab from current layout
   * @param {Object} tabObject
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
   * @param {String} layoutName - name of the new layout tha tis being created
   */
  async duplicate(layoutName) {
    if (!layoutName) {
      this.model.notification.show(`Layout was not duplicated due to invalid/missing new name`, 'warning');
      return;
    }
    const itemToDuplicate = clone(this.item);

    // Create tabs for new layout
    const tabs = [];

    itemToDuplicate.tabs.forEach(function(tab) {
      const duplicatedTab = {
        id: objectId(),
        name: tab.name,
        objects: clone(tab.objects)
      };
      tabs.push(duplicatedTab);
    });

    // Create new duplicated layout
    const layout = assertLayout({
      id: objectId(),
      name: layoutName,
      owner_id: this.model.session.personid,
      owner_name: this.model.session.name,
      tabs: tabs
    });

    const result = await this.model.layoutService.createNewLayout(layout);
    // TODO Newly created item should be sent back by the API. This will prevent having to reload the item again below
    if (result.isSuccess()) {
      await this.loadItem(layout.id);
      this.model.notification.show(`Layout "${itemToDuplicate.name}" ` +
        `has been successfully duplicated into "${this.item.name}".`, 'success');
      this.model.router.go(`?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}`, false, false);
      this.loadMyList();
    } else {
      this.model.notification.show(`Layout "${itemToDuplicate.name}" has not been duplicated.`, 'danger');
    }
  }

  /**
   * Method to check if passed layout contains any objects in online mode
   * @param {Layout} layout
   * @return {boolean}
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
}
