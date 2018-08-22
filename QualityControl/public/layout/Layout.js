import {Observable, fetchClient, RemoteData} from '/js/src/index.js';

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

    this.searchInput = '';
    this.searchResult = null; // null means no search, sub-array of `list`

    this.editEnabled = false; // activate UI for adding, dragging and deleting tabObjects inside the current tab
    this.editingTabObject = null; // pointer to a tabObject beeing modified
    this.editOriginalClone = null; // contains a deep clone of item before editing

    // https://github.com/hootsuite/grid
    this.gridList = new GridList([], {
      direction: 'vertical',
      lanes: 3
    });
    // gridList.grid.length: integer, number of rows
  }

  /**
   * Load all available layouts shared by users inside `list`
   */
  async loadList() {
    const {result, ok} = await this.model.loader.post('/api/listLayouts');
    if (!ok) {
      this.model.notification.show(`Unable to load layouts.`, 'danger', Infinity);
      this.list = [];
      return;
    }

    this.list = assertLayouts(result);
    this.notify();
  }

  /**
   * Load layouts of current user inside `myList`
   */
  async loadMyList() {
    this.myList = RemoteData.loading();

    const {result, ok} = await this.model.loader.post('/api/listLayouts', {owner_id: this.model.session.personid});
    if (!ok) {
      this.model.notification.show(`Unable to load your personnal layouts.`, 'danger', Infinity);
      this.myList = RemoteData.failure();
    } else {
      this.myList = RemoteData.success(assertLayouts(result));
    }

    this.notify();
  }

  /**
   * Load a single layout inside `item` and make its first tab selected
   * @param {number} layoutId
   */
  async loadItem(layoutId) {
    if (!layoutId) {
      throw new Error('layoutId parameter is mandatory');
    }

    this.item = null;
    const {result, ok} = await this.model.loader.post('/api/readLayout', {layoutId: layoutId});
    if (!ok) {
      this.model.notification.show(`Unable to load layout, it might have been deleted.`, 'warning');
      this.model.router.go(`?page=layouts`);
      throw new Error(result.message);
    }

    this.item = assertLayout(result);
    this.selectTab(0);
    this.notify();
  }

  /**
   * Creates a new empty layout with a name, go to its own page in edit mode afterward
   * @param {string} layoutName
   */
  async newItem(layoutName) {
    if (!layoutName) {
      throw new Error('layoutName parameter is mandatory');
    }

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

    const {result, ok} = await this.model.loader.post('/api/layout', layout);
    if (!ok) {
      this.model.notification.show(result.error || 'Unable to create layout', 'danger', Infinity);
      return;
    }

    // Read the new layout created and edit it
    this.model.router.go(`?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}&edit=true`, false, false);

    // Update user list in background
    this.loadMyList();
  }

  /**
   * Delete current layout inside `item` from the server
   */
  async deleteItem() {
    if (!this.item) {
      throw new Error('no layout to delete');
    }

    const req = fetchClient(`/api/layout/${this.item.id}`, {method: 'DELETE'});
    this.model.loader.watchPromise(req);
    await req;

    this.model.notification.show(`Layout "${this.item.name}" has been deleted.`, 'success');
    this.model.router.go(`?page=layouts`);
    this.loadMyList();
    this.editEnabled = false;
    this.notify();
  }

  /**
   * Save current `item` layout to server
   */
  saveItem() {
    if (!this.item) {
      throw new Error('no layout to save');
    }

    const options = {
      method: 'POST',
      body: JSON.stringify(this.item),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const request = fetchClient(`/api/writeLayout?layoutId=${this.item.id}`, options);
    this.model.loader.watchPromise(request);

    request
      .then((res) => res.json())
      .then(() => {
        this.model.notification.show(`Layout "${this.item.name}" has been saved.`, 'success');
        this.notify();
      });
  }

  /**
   * Compute grid positoins of the current tab selected
   */
  sortObjectsOfCurrentTab() {
    this.gridList.items = this.tab.objects;
    this.gridList.resizeGrid(3);
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
      name,
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

    if (!searchInput) {
      this.searchResult = null;
      this.notify();
      return;
    }

    const fuzzyRegex = new RegExp(searchInput.split('').join('.*?'), 'i');
    this.searchResult = this.list.filter((item) => item.name.match(fuzzyRegex));
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
}
