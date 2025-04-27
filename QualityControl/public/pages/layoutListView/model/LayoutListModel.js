import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';

import { Observable } from '/js/src/index.js';
import FolderModel, { FolderType } from '../../../folder/model/FolderModel.js';
import LayoutCardModel from './LayoutCardModel.js';

export default class LayoutListModel extends Observable {
  constructor(model) {
    super();
    this.model = model;
    this.searchInput = '';
    this.folders = new Map();

    this._initializeFolders();
  }

  _initializeFolders() {
    const official = new FolderModel(this, 'Official', FolderType.PRIMARY, LayoutCardModel);
    const myLayouts = new FolderModel(this, 'My Layouts', FolderType.SECONDARY, LayoutCardModel);
    const allLayouts = new FolderModel(this, 'All Layouts', FolderType.SECONDARY, LayoutCardModel);

    official.toggleFolder();
    myLayouts.toggleFolder();

    official.bubbleTo(this);
    myLayouts.bubbleTo(this);
    allLayouts.bubbleTo(this);

    this.folders.set('Official', official);
    this.folders.set('My Layouts', myLayouts);
    this.folders.set('All Layouts', allLayouts);

    this.notify();
  }

  /**
   * Set user's input for search and use a fuzzy algo to filter list of layouts.
   * Fuzzy allows missing chars "aaa" can find "a/a/a" or "aa/a/bbbbb"
   * @param {string} searchInput - string input from the user to search by
   * @returns {undefined}
   */
  search(searchInput) {
    this.searchInput = searchInput;
    this.folders.forEach((folder) => {
      folder.searchInput = new RegExp(searchInput, 'i');
    });
    this.notify();
  }

  /**
   * Given an ID and new value for official status, update it accordingly
   * @param {string} id - of layout to modify
   * @returns {void}
   */
  async toggleOfficial(id) {
    const { payload } = this.folders.get('All Layouts').list;
    const { isOfficial } = payload.find((item) => item.id === id);

    await this.model.services.layout.patchLayout(id, { isOfficial: !isOfficial });
    await this.model.services.layout.getLayouts(this);
    await this.model.services.layout.getLayoutsByUserId(this.model.session.personid, this);
    this.model.notify();
  };

  async sufficientAuthority() {
    return this.model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
  }
}
