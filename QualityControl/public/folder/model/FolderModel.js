import { Observable, RemoteData } from '/js/src/index.js';

/**
 * Enumeration of folder types with their corresponding CSS classes
 * @enum {string}
 */
export const FolderType = Object.freeze({
  PRIMARY: 'bg-primary white',
  SECONDARY: 'bg-gray-light',
});

/**
 * Model namespace for ObjectViewPage
 */
export default class FolderModel extends Observable {
  /**
   * Creates a new FolderModel instance
   * @param {Model} model - The parent model utilizing this folder
   * @param {string} title - Display title for the folder
   * @param {FolderType} folderType - Visual style type for the folder
   * The constuctor is required to accept the arguments model:FolderModel and json:JSON.
   */
  constructor(model, title, folderType) {
    super();
    this.list = RemoteData.notAsked();
    this.title = title;
    this.isOpened = false;
    this.model = model;
    this.folderType = folderType;
  }

  toggleFolder() {
    this.isOpened = !this.isOpened;
    this.notify();
  }
}
