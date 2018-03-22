import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';
import GridList from './Grid.js';

export default class Layout extends Observable {
  constructor(model) {
    super();

    this.model = model;

    this.list = null; // array of layouts
    this.item = null; // layout containing an array of tabs
    this.tab = null; // pointer to a tab from `item`

    this.searchInput = '';
    this.searchResult = null; // null means no search, sub-array of `list`

    this.editEnabled = false; // activate UI for adding, dragging and deleting tabObjects inside the current tab
    this.editingItem = null; // pointer to a tabObject begin modified

    // https://github.com/hootsuite/grid
    this.gridList = new GridList([], {
      direction: 'vertical',
      lanes: 3
    });
    // gridList.grid.length: integer, number of rows

    this.canvasHeight = 0;
  }

  loadList() {
    return this.model.loader.watchPromise(fetchClient(`/api/listLayouts`, {method: 'POST'})
      .then(res => res.json())
      .then(list => {
        this.list = list;
        this.notify();
      })
    );
  }

  loadItem(layoutName) {
    if (!layoutName) {
      throw new Error('layoutName is mandatory');
    }
    return this.model.loader.watchPromise(fetchClient(`/api/readLayout?layoutName=${layoutName}`, {method: 'POST'})
      .then(res => res.json())
      .then(item => {
        this.item = item;
        this.selectTab(0);
        this.notify();
      })
    );
  }

  selectTab(index) {
    if (!this.item.folders[index]) {
      return;
    }

    this.tab = this.item.folders[index];
    this.gridList.items = this.tab.objects.map(object => ({x: 0, y: 0, h: 1, w: 1, object}));
    this.gridList.resizeGrid(3);
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

  editToggle() {
    this.editEnabled = !this.editEnabled;

    // Reset and free memory
    this.itemMoving = null;
    this.editingItem = null;
    this.originalItems = null;

    this.notify();
  }

  setCanvasHeight(height) {
    this.canvasHeight = height;
  }

  addItem(objectName) {console.log('objectName:', objectName);
    const newItem = {
      x: 0,
      y: 100, // place it at the end first
      h: 1,
      w: 1,
      object: {
        name: objectName
      }
    };
    this.gridList.items.push(newItem);
    this.gridList.resizeGrid(3);
    this.notify();
    return newItem;
  }

  moveItemStart(item) {
    console.log('move item start', item);
    this.itemMoving = item.object;
    this.originalItems = this.gridList.items.concat().map((item, i) => Object.assign({}, item));
    this.notify();
  }

  moveItemStop() {
    console.log('move item stop');
    this.itemMoving = null;
    this.editingItem = null;
    this.notify();
  }

  moveItemToPosition(newX, newY) {
    if (!this.itemMoving) {
      return;
    }
    this.gridList.items = this.originalItems.concat().map((item, i) => Object.assign({}, item));
    this.gridList.moveItemToPosition(this.gridList.items.find(item => item.object === this.itemMoving), [newX, newY]);
    this.notify();
  }

  resizeItem(item, w, h) {
    this.gridList.resizeItem(item, {w, h});
    this.notify();
  }

  editItem(item) {
    this.editingItem = item;
    this.notify();
  }

  deleteItem(item) {
    if (this.editingItem === item) {
      this.editingItem = null;
    }
    this.gridList.items = this.gridList.items.filter(_item => _item !== item);
    this.gridList.resizeGrid(3);
    this.notify();
  }
}
