import sessionService from '/js/src/sessionService.js';
import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';

import GridList from './Grid.js';
import {objectId, clone} from '../utils.js';
import {assertTabObject, assertLayout, assertLayouts} from '../Types.js';

export default class Layout extends Observable {
  constructor(model) {
    super();

    this.model = model;

    this.list = null; // array of layouts
    this.item = null; // layout containing an array of tabs
    this.tab = null; // pointer to a tab from `item`

    this.myList = null; // array of layouts

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

  loadList() {
    return this.model.loader.watchPromise(fetchClient(`/api/layout`, {method: 'GET'})
      .then(res => res.json())
      .then(list => {
        this.list = assertLayouts(list);
        this.notify();
      })
    );
  }

  async loadMyList() {
    const req = fetchClient(`/api/layout?owner_id=${this.model.session.personid}`, {method: 'GET'});
    const {result, response} = await this.model.loader.intercept(req);
    if (!response.ok) {
      throw new Error('unable to load layouts of user');
    }

    this.myList = assertLayouts(result);
    this.notify();
  }

  async loadItem(layoutName) {
    if (!layoutName) {
      throw new Error('layoutName parameter is mandatory');
    }

    const req = fetchClient(`/api/readLayout?layoutName=${layoutName}`, {method: 'POST'});
    const {result, response} = await this.model.loader.intercept(req);
    if (!response.ok) {
      throw new Error(`unable to load layout "${layoutName}"`);
    }

    this.item = assertLayout(result);
    this.selectTab(0);
    this.notify();
  }

  async newItem(layoutName) {
    if (!layoutName) {
      throw new Error('layoutName parameter is mandatory');
    }

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const body = assertLayout({
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
    const req = fetchClient(`/api/layout`, {method: 'POST', headers, body: JSON.stringify(body)});
    this.model.loader.watchPromise(req);
    const res = await req;

    // Read the new layout created
    await this.loadItem(layoutName);

    this.model.router.go(`?page=layoutShow&layout=${encodeURIComponent(layoutName)}`, false, true);
    this.edit(); // edit the new item after loading page
    this.loadMyList();
  }

  async deleteItem() {
    if (!this.item) {
      throw new Error('no layout to delete');
    }

    const req = fetchClient(`/api/layout/${this.item.name}`, {method: 'DELETE'});
    this.model.loader.watchPromise(req);
    const res = await req;
    // const layout = await res.json();

    this.model.router.go(`?page=layouts`);
    this.loadMyList();
    this.editEnabled = false;
    this.notify();
  }

  saveItem() {
    if (!this.item) {
      throw new Error('no layout to save');
    }

    return this.model.loader.watchPromise(fetchClient(`/api/writeLayout?layoutName=${this.item.name}`, {method: 'POST', body: JSON.stringify(this.item),     headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },})
      .then(res => res.json())
      .then(item => {
        this.notify();
      })
    );
  }

  sortObjectsOfCurrentTab() {
    this.gridList.items = this.tab.objects;
    this.gridList.resizeGrid(3);
  }

  selectTab(index) {
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }

    this.tab = this.item.tabs[index];
    this.sortObjectsOfCurrentTab();
    this.notify();
  }

  deleteTab(index) {
    if (!this.item.tabs[index]) {
      throw new Error(`index ${index} does not exist`);
    }
    if (this.item.tabs.length <= 1) {
      throw new Error(`deleting last tab is forbidden`);
    }

    this.item.tabs.splice(index, 1);
    this.notify();
  }

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

  search(searchInput) {
    this.searchInput = searchInput;

    if (!searchInput) {
      this.searchResult = null;
      this.notify();
      return;
    }

    const fuzzyRegex = new RegExp(searchInput.split('').join('.*?'), 'i');
    this.searchResult = this.list.filter(item => item.name.match(fuzzyRegex));
    this.notify();
  }

  /**
   * Creates a deep clone of current `item` to edit it without side effect.
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
    console.log('save layout', this.item);
    this.saveItem();
    this.notify();
  }

  /**
   * Ends editing and replaces the current layout by the original before editing
   */
  cancelEdit() {
    this.editEnabled = false;
    this.editingTabObject = null;
    this.item = this.editOriginalClone;
    this.selectTab(0);
    this.notify();
  }

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

  moveTabObjectStart(tabObject) {
    this.tabObjectMoving = tabObject;
    this.originalItems = clone(this.tab.objects);
    this.notify();
  }

  moveTabObjectStop() {
    this.tabObjectMoving = null;
    this.notify();
  }

  moveTabObjectToPosition(newX, newY) {
    if (!this.tabObjectMoving) {
      return;
    }
    this.tab.objects = clone(this.originalItems);
    this.gridList.items = this.tab.objects;
    const tabObjectToMove = this.tab.objects.find(tabObject => tabObject.id === this.tabObjectMoving.id);
    if (!tabObjectToMove) {
      throw new Error(`the tabObject ${this.tabObjectMoving.id} was not found in the objects of the current tab`);
    }
    this.gridList.moveItemToPosition(tabObjectToMove, [newX, newY]);
    this.notify();
  }

  resizeTabObject(tabObject, w, h) {
    this.gridList.resizeItem(tabObject, {w, h});
    this.notify();
  }

  toggleTabObjectOption(tabObject, option) {
    const index = tabObject.options.indexOf(option);
    if (index >= 0) {
      tabObject.options.splice(index, 1);
    } else {
      tabObject.options.push(option);
    }
    this.notify();
  }

  editTabObject(tabObject) {
    this.editingTabObject = tabObject;
    this.notify();
  }

  deleteTabObject(tabObject) {
    if (tabObject === this.editingTabObject) {
      this.editingTabObject = null;
    }
    this.tab.objects = this.tab.objects.filter(item => item.id !== tabObject.id);
    this.sortObjectsOfCurrentTab();
    this.notify();
  }
}
