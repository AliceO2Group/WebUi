import {Observable} from '/js/src/index.js';

/**
 * This class allows to transforms objects names (A/B/C) into a tree that can have
 * some behaviours like open/close nodes. It also allows to update all those objects without creating
 * a new tree.
 */
export default class ObjectTree extends Observable {
  /**
   * Instantiate tree with a root node called `name`, empty by default
   * @param {string} name - root name
   * @param {ObjectTree} parent - optional parent node
   */
  constructor(name, parent) {
    super();
    this.initTree(name, parent);
  }

  /**
   * Method to instantiate/reset the tree
   * @param {string} name
   * @param {string} parent
   */
  initTree(name, parent) {
    this.name = name || ''; // like 'B'
    this.object = null;
    this.open = false;
    this.children = []; // <Array<ObjectTree>>
    this.parent = parent || null; // <ObjectTree>
    this.path = []; // like ['A', 'B'] for node at path 'A/B' called 'B'
    this.pathString = ''; // 'A/B'
    this.quality = null; // most negative quality from this subtree
  }
  /**
   * Toggle this node (open/close)
   */
  toggle() {
    this.open = !this.open;
    this.notify();
  }

  /**
   * Open all or close all nodes of the tree
   */
  toggleAll() {
    this.open ? this.closeAll() : this.openAll();
  }

  /**
   * Open all nodes of the tree
   */
  openAll() {
    this.open = true;
    this.children.forEach((child) => child.openAll());
    this.notify();
  }

  /**
   * Close all nodes of the tree
   */
  closeAll() {
    this.open = false;
    this.children.forEach((child) => child.closeAll());
    this.notify();
  }

  /**
   * Add recursively an object inside a tree
   * @param {Object} object - The object to be inserted, property name must exist
   * @param {Array.<string>} path - Path of the object to dig in before assigning to a tree node, if null object.name is used
   * @param {Array.<string>} pathParent - Path of the current tree node, if null object.name is used
   *
   * Example of recurvive call:
   *  addChild(o) // begin insert 'A/B'
   *  addChild(o, ['A', 'B'], [])
   *  addChild(o, ['B'], ['A'])
   *  addChild(o, [], ['A', 'B']) // end inserting, affecting B
   */
  addChild(object, path, pathParent) {
    // Fill the path argument through recursive call
    if (!path) {
      if (!object.name) {
        throw new Error('Object name must exist');
      }
      path = object.name.split('/');
      this.addChild(object, path, []);
      this.notify();
      return;
    }

    // Keep quality of wrost quality of all leaf
    // so the root has the wrost quality, easy to monitor
    if (!this.quality || object.quality === 'bad') {
      this.quality = object.quality;
    }

    // Case end of path, associate the object to 'this' node
    if (path.length === 0) {
      this.object = object;
      return;
    }

    // Case we need to pass to subtree
    const name = path.shift();
    const fullPath = [...pathParent, name];
    let subtree = this.children.find((children) => children.name === name);

    // Subtree does not exist yet
    if (!subtree) {
      // Create it and push as child
      // Listen also for changes to bubble it until root
      subtree = new ObjectTree(name, this);
      subtree.path = fullPath;
      subtree.pathString = fullPath.join('/');
      this.children.push(subtree);
      subtree.observe(() => this.notify());
    }

    // Pass to child
    subtree.addChild(object, path, fullPath);
  }

  /**
   * Add a list of objects by calling `addChild`
   * @param {Array} objects
   */
  addChildren(objects) {
    objects.forEach((object) => this.addChild(object));
  }
}
