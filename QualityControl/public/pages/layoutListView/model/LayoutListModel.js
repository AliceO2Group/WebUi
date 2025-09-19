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

import FolderModel, { FolderType } from '../../../folder/model/FolderModel.js';
import LayoutCardModel from './LayoutCardModel.js';
import { BaseViewModel } from '../../../common/abstracts/BaseViewModel.js';
import { RequestFields } from '../../../common/RequestFields.enum.js';

/**
 * LayoutListModel namespace to control the layoutCards spread between its folders
 */
export default class LayoutListModel extends BaseViewModel {
  /**
   * Creates a new LayoutListModel instance
   * @param {Model} model - The the application model
   */
  constructor(model) {
    super();
    this.model = model;
    this._searchInput = '';
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
   * Getter for search input that returns trimmed value
   * @returns {string} The trimmed search input
   */
  get searchInput() {
    return this._searchInput.trim();
  }

  /**
   * Set user's input for search and use a fuzzy algo to filter list of layouts.
   * Fuzzy allows missing chars "aaa" can find "a/a/a" or "aa/a/bbbbb"
   * @param {string} searchInput - string input from the user to search by
   * @param {string} objectPath - string input from the user to search layouts by objectPath
   * @returns {undefined}
   */
  search(searchInput, objectPath) {
    if (objectPath === undefined) {
      this._searchInput = searchInput;
      this.folders.forEach((folder) => {
        folder.searchInput = new RegExp(searchInput, 'i');
      });
      this.notify();
    } else {
      const layoutService = this.model.services.layout;
      this._searchInput = objectPath;
      layoutService.getLayouts(RequestFields.LAYOUT_CARD, { objectPath }, this.model);
    }
  }

  /**
   * Fluent interface for removing layouts
   * @param {LayoutCardModel} layout - Layout to remove
   * @returns {object} Object with .from() method
   */
  removeLayout(layout) {
    return {

      /**
       * Specifies source folder for removal
       * @param {string} folderName - Folder name
       */
      from: (folderName) => {
        this.folders.get(folderName)?.removeItem(layout);
      },
    };
  }

  /**
   * Begins the process of adding a layout by returning an intermediate object with .to() method
   * @param {LayoutCardModel} layout - Layout instance to add
   * @returns {object} Intermediate object with .to() method
   */
  setLayout(layout) {
    return {

      /**
       * Completes the add operation by specifying the target folder
       * @param {string} folderName - Name of the folder to add to
       */
      in: (folderName) => {
        this.folders.get(folderName)?.set(layout);
      },
    };
  }
}
