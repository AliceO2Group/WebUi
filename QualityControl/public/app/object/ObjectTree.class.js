import {Observable} from '/js/src/index.js';

export default class ObjectTree extends Observable {
  constructor(name, parent) {
    super();
    this.name = name || '';
    this.object = null;
    this.open = false;
    this.childrens = [];
    this.parent = parent || null;
    this.path = [];

    this.status = null; // most negative status from this subtree
  }

  toggle() {
    this.open = !this.open;
    this.notify();
  }

  toggleAll() {
    this.open ? this.closeAll() : this.openAll();
  }

  openAll() {
    this.open = true;
    this.childrens.forEach(chidren => chidren.openAll());
    this.notify();
  }

  closeAll() {
    this.open = false;
    this.childrens.forEach(chidren => chidren.closeAll());
    this.notify();
  }

  /**
   * Add recursively an object inside a tree
   * @param {object} object - The object to be inserted, property name must exist
   * @param {array of string} path - Path of the object to dig in before assigning to a tree node, if null object.name is used
   * @param {array of string} pathParent - Path of the current tree node, if null object.name is used
   *
   * Example of recurvive call:
   *  addChildren(o)
   *  addChildren(o, ['A', 'B'], [])
   *  addChildren(o, ['B'], ['A'])
   *  addChildren(o, [], ['A', 'B'])
   */
  addChildren(object, path, pathParent) {
    // Fill the path argument through recursive call
    if (!path) {
      if (!object.name) {
        throw new Error('Object name must exist');
      }
      path = object.name.split('/');
      this.addChildren(object, path, []);
      this.notify();
      return;
    }

    // Keep status of wrost status of all leaf
    // so the root has the wrost status, easy to monitor
    if (!this.status || object.status === 'inactive') {
      this.status = object.status;
    }

    // Case end of path, associate the object to 'this' node
    if (path.length === 0) {
      this.object = object;
      return;
    }

    // Case we need to pass to subtree
    const name = path.shift();
    const fullPath = [...pathParent, name];
    let subtree = this.childrens.find(children => children.name === name);

    // Subtree does not exist yet
    if (!subtree) {
      // Create it and push as children
      // Listen also for changes to bubble it until root
      subtree = new ObjectTree(name, this);
      subtree.path = fullPath;
      this.childrens.push(subtree);
      subtree.observe(e => this.notify());
    }

    // Pass to children
    subtree.addChildren(object, path, fullPath);
  }

  addChildrens(objects) {
    objects.forEach(object => this.addChildren(object));
  }
}
