import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';

import ObjectTree from './ObjectTree.class.js'

export default class Object_ extends Observable {
  constructor(model) {
    super();

    this.model = model;

    this.list = null;
    this.tree = null; // ObjectTree
    this.selected = null; // object - id of object
    this.objects = {};

    this.searchInput = ''; // string - content of input search
    this.searchResult = null; // array - result list of search

    this.refreshTimer = 0;
    this.refreshInterval = 0; // seconds
    this.setRefreshInterval(2);
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
    object.lastUpdate = new Date();
    this.objects[objectName] = object;
    this.notify();
  }

  unloadObject(objectName) {
    delete this.objects[objectName];
    this.notify();
  }

  setRefreshInterval(intervalSeconds) {
    clearInterval(this.refreshTimer);

    const parsedValue = parseInt(intervalSeconds, 10);
    if (isNaN(parsedValue) || parsedValue < 1) {
      parsedValue = 2;
    }

    this.refreshInterval = intervalSeconds;
    this.refreshTimer = setInterval(() => {
      Object.keys(this.objects).forEach((objectName) => {
        this.loadObject(objectName);
      });
    }, this.refreshInterval * 1000);
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
