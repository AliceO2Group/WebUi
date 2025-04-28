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
   * @param {Function} itemConstructor - Constructor function for creating items in this folder.
   * The constuctor is required to accept the arguments model:FolderModel and json:JSON.
   */
  constructor(model, title, folderType, itemConstructor) {
    super();
    this.model = model;
    this._list = RemoteData.notAsked();
    this.title = title;
    this.isOpened = false;
    this.folderType = folderType;
    this.itemConstructor = itemConstructor;
  }

  toggleFolder() {
    this.isOpened = !this.isOpened;
    this.notify();
  }

  get list() {
    return this._list;
  }

  /**
   * Sets the list of items in the folder and transforms each item using the itemConstructor
   * @param {RemoteData} value - The new list data to set
   * @returns {void}
   */
  set list(value) {
    if (!value.isSuccess()) {
      this._list = value;
      this.notify();
      return;
    }

    const transformedPayload = value.payload.map((item) => {
      const card = new this.itemConstructor(this.model, item);
      card.bubbleTo(this);
      return card;
    });

    this._list = RemoteData.success(transformedPayload);
    this.notify();
  }
}
