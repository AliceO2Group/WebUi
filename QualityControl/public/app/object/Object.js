import {Observable, fetchClient, WebSocketClient} from '/js/src/index.js';

import ObjectTree from './ObjectTree.class.js'

export default class Object_ extends Observable {
  constructor(model) {
    super();

    this.model = model;

    this.list = null;
    this.tree = null; // ObjectTree
    this.selected = null; // object - id of object
    this.objects = {}; // key -> value for object name -> object full content
    this.objectsReferences = {}; // object name -> number of

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

  /**
   * Load full content of an object in-memory, do nothing if already in.
   * Also adds a reference to this object.
   * @param {string} objectName - e.g. /FULL/OBJECT/PATH
   * @return {Promise}
   */
  async loadObject(objectName) {
    if (!this.objectsReferences[objectName]) {
      this.objectsReferences[objectName] = 1;
    } else {
      this.objectsReferences[objectName]++;
      return;
    }

    const req = fetchClient(`/api/readObjectData?objectName=${objectName}`, {method: 'POST'});
    this.model.loader.watchPromise(req);
    const res = await req;
    const json = await res.text();
    const object = JSROOT.parse(json);
    object.lastUpdate = new Date();
    this.objects[objectName] = object;
    this.notify();
  }

  /**
   * Reload currently used objects which have a number of references greater or equal to 1
   */
  async loadObjects(objectsNames) {
    if (!objectsNames || !objectsNames.length) {
      return;
    }

    const reqUrl = new URL('/api/readObjectsData', window.location);
    for (let name of objectsNames) {
      reqUrl.searchParams.append('objectName', name);
    }
    const req = fetchClient(reqUrl, {method: 'GET'});
    this.model.loader.watchPromise(req);
    const res = await req;
    const json = await res.text();
    const objects = JSROOT.parse(json);

    for (let name in objects) {
      this.objects[name] = objects[name];
    }
    this.notify();
  }

  /**
   * Removes a reference to the specified object and unload it from memory if not used anymore
   * @param {string} objectName - The object name like /FULL/OBJ/NAME
   */
  unloadObject(objectName) {
    this.objectsReferences[objectName]--;

    // No more used
    if (!this.objectsReferences[objectName]) {
      delete this.objects[objectName];
      delete this.objectsReferences[objectName];
    }

    this.notify();
  }

  setRefreshInterval(intervalSeconds) {
    // Stop any other timer
    clearTimeout(this.refreshTimer);

    // Validate user input
    const parsedValue = parseInt(intervalSeconds, 10);
    if (isNaN(parsedValue) || parsedValue < 1) {
      parsedValue = 2;
    }

    // Start new timer
    this.refreshInterval = intervalSeconds;
    this.refreshTimer = setTimeout(() => {this.setRefreshInterval(this.refreshInterval);}, this.refreshInterval * 1000);
    this.notify();

    // Refreshed currently seen objects
    this.loadObjects(Object.keys(this.objects));

    // refreshTimer is a timer id (number) and is also used in the view to
    // interpret new cycle when this number changes
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
