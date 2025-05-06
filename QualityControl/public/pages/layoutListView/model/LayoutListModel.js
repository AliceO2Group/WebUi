/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';
import { Observable } from '/js/src/index.js';
import FolderModel, { FolderType } from '../../../folder/model/FolderModel.js';
import LayoutCardModel from './LayoutCardModel.js';

export default class LayoutListModel extends Observable {
  /**
   * Creates a new LayoutCardModel instance
   * @param {Model} model - The the application model
   */
  constructor(model) {
    super();
    this.model = model;
    this.searchInput = '';
    this.folders = new Map();

    this._initializeFolders();
  }

  /**
   * Initializes the default folders for layouts
   * Creates three default folders: Official, My Layouts, and All Layouts
   * Sets Official and My Layouts folders to be expanded by default
   * @private
   */
  _initializeFolders() {
    const official = new FolderModel(this.model, 'Official', FolderType.PRIMARY, LayoutCardModel);
    const myLayouts = new FolderModel(this.model, 'My Layouts', FolderType.SECONDARY, LayoutCardModel);
    const allLayouts = new FolderModel(this.model, 'All Layouts', FolderType.SECONDARY, LayoutCardModel);

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
   * @returns {undefined}
   */
  async toggleOfficial(id) {
    const { payload } = this.folders.get('All Layouts').list;
    const { isOfficial } = payload.find((item) => item.id === id);

    await this.model.services.layout.patchLayout(id, { isOfficial: !isOfficial });
    await this.model.services.layout.getLayouts(this);
    await this.model.services.layout.getLayoutsByUserId(this.model.session.personid, this);
    this.model.notify();
  };

  /**
   * Removes a layout from a specific folder
   * @param {string} folderName - Name of the folder to remove the layout from
   * @param {LayoutCardModel} layout - Layout instance to remove
   * @returns {void}
   */
  removeLayoutFrom(folderName, layout) {
    this.folders.get(folderName).removeItem(layout);
  }

  /**
   * Adds a layout to a specific folder
   * @param {string} folderName - Name of the folder to add the layout to
   * @param {LayoutCardModel} layout - Layout instance to add
   * @returns {void}
   */
  addLayoutTo(folderName, layout) {
    this.folders.get(folderName).push(layout);
  }

  /**
   * Checks if the current user has sufficient authority (GLOBAL role)
   * @async
   * @returns {boolean} True if user has sufficient authority
   */
  sufficientAuthority() {
    return this.model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
  }
}
