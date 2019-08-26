import {Observable} from '/js/src/index.js';

/**
 * Model namespace for Folder type,
 * and search them.
 */
export default class Folder extends Observable {
  /**
   * Initialize with empty values
   * @param {string} model
   * @param {boolean} isOpened
   */
  constructor(model) {
    super();
    this.model = model;
    this.map = new Map();
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
    const folderExistsAlready = this.map.get(folder.title);
    if (folderExistsAlready) {
      return false;
    }

    this.map.set(folder.title, folder);
    this.notify();
    return true;
  }

  /**
   * Method to close/open a folder
   * @param {string} title
   * @return {boolean}
   */
  toggleFolder(title) {
    const state = this.map.get(title).isOpened;
    this.map.get(title).isOpened = !state;
    this.notify();
    return !state;
  }
}
