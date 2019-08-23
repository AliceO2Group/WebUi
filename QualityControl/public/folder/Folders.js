import {Observable} from '/js/src/index.js';

/**
 * Model namespace with all requests to load or create layouts, compute their position on a grid,
 * and search them.
 */
export default class Folders extends Observable {
  /**
   * Initialize with empty values
   * @param {string} model
   * @param {boolean} isOpened
   */
  constructor(model) {
    super();
    this.model = model;
    this.list = new Map();
  }

  /**
   * Add new folder and return if it was successful or not
   * @param {JSON} folder
   * @return {boolean}
   */
  addFolder(folder) {
    if (!folder.title || folder.title.trim() === '') {
      return false;
    }
    if (folder.isOpened === null || folder.isOpened === 'undefined') {
      folder.isOpened = false;
    }
    const folderExistsAlready = this.list.get(folder.title);
    if (folderExistsAlready) {
      return false;
    }

    this.list.set(folder.title, folder);
    this.notify();
    return true;
  }

  /**
   * Method to close/open a folder
   * @param {string} title
   * @return {boolean}
   */
  toggleFolder(title) {
    const state = this.list.get(title).isOpened;
    this.list.get(title).isOpened = !state;
    this.notify();
    return !state;
  }
}
