import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';

import Folder from '../../../folder/Folder.js';
import { Observable, RemoteData } from '/js/src/index.js';

export default class LayoutListModel extends Observable {
  constructor(model) {
    super();
    this.model = model;
    this.searchInput = '';

    this.folder = new Folder(this);
    this.folder.addFolder({
      title: 'Official', isOpened: true, list: RemoteData.notAsked(), searchInput: '', classList: 'bg-primary white',
    });
    this.folder.addFolder({ title: 'My Layouts', isOpened: true, list: RemoteData.notAsked(), searchInput: '' });
    this.folder.addFolder({ title: 'All Layouts', isOpened: false, list: RemoteData.notAsked(), searchInput: '' });
    this.folder.bubbleTo(this);
  }

  /**
   * Set user's input for search and use a fuzzy algo to filter list of layouts.
   * Fuzzy allows missing chars "aaa" can find "a/a/a" or "aa/a/bbbbb"
   * @param {string} searchInput - string input from the user to search by
   * @returns {undefined}
   */
  search(searchInput) {
    this.searchInput = searchInput;
    this.folder.map.forEach((folder) => {
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
    const { payload } = this.folder.map.get('All Layouts').list;
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
