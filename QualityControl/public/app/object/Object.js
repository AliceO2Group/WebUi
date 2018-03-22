import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';

import ObjectTree from './ObjectTree.class.js'

export default class Object extends Observable {
  constructor(model) {
    super();

    this.model = model;

    this.list = null;
    this.tree = null; // ObjectTree
    this.selected = null; // object - id of object
    this.objects = {};

    this.searchInput = ''; // string - content of input search
    this.searchResult = null; // array - result list of search
  }

  async loadList() {
    const req = fetchClient(`/api/listObjects?`, {method: 'POST'});
    this.model.loader.watchPromise(req);
    const res = await req;
    const list = await res.json();

    if (!this.tree) {
      this.tree = new ObjectTree('database');
      this.tree.bubbleTo(this);
    }

    this.tree.addChildrens(list);
    this.list = list;
  }

  async loadObject(objectName) {
    const req = fetchClient(`/api/readObjectData?objectName=${objectName}`, {method: 'POST'});
    this.model.loader.watchPromise(req);
    const res = await req;
    const json = await res.text();
    const object = JSROOT.parse(json);
    this.objects[objectName] = object;
    this.notify();
  }

  select(object) {
    this.selected = object;
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
    this.searchInput = searchInput;
    this.searchResult = this.list.filter(item => {
      return item.name.match(fuzzyRegex);
    });

    this.notify();
  }
}
