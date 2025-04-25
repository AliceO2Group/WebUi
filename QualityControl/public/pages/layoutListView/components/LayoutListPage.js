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

import { h } from '/js/src/index.js';
import { iconChevronBottom, iconChevronTop } from '/js/src/icons.js';
import LayoutListCard from './LayoutListCard.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {object} model - LayoutListModel: respondible for managing the page's state.
 * @returns {vnode} - virtual node element
 */
export default function (model) {
  return h('.scroll-y.absolute-fill', {
    style: 'display: flex; flex-direction: column',
  }, [
    Array.from(model.folder.map.values())
      .map((folder) => createFolder(model, folder)),
  ]);
}

/**
 * Method to create a folder with various layouts
 * @param {object} model - LayoutListModel: respondible for managing the page's state.
 * @param {Folder} folder - folder model
 * @returns {vnode} - virtual node element
 */
function createFolder(model, folder) {
  const layouts = folder.list;
  const searchBy = folder.searchInput;
  return h(
    '.m2.shadow-level3.br3.flex-column',
    [
      createHeaderOfFolder(model, folder),
      ' ',
      folder.isOpened ? layoutCards(model, layouts, searchBy) : null,
    ],
  );
}

/**
 * Create the header of the folder
 * @param {object} model - LayoutListModel: respondible for managing the page's state.
 * @param {Folder} folder - folder model
 * @returns {vnode} - virtual node element
 */
function createHeaderOfFolder(model, folder) {
  return h(
    '.p2.object-selectable',
    {
      style: 'border-radius: .5rem .5rem 0 0; display: flex; flex-direction: row',
      class: folder.classList,
      onclick: () => model.folder.toggleFolder(folder.title),
    },
    [
      h('b', { style: 'flex-grow:1;' }, [
        h('span', {
          style: ' text-align: right',
        }, folder.isOpened ? iconChevronTop() : iconChevronBottom()), ' ', folder.title,
      ]),
    ],
  );
}

/**
 * Displays the layouts as a set of cards in a 3-column grid.
 * @param {object} model - LayoutListModel: respondible for managing the page's state.
 * @param {RemoteData} layouts - list of layouts as remoteData object.
 * @param {string} searchBy - string to search by in the list of layouts.
 * @returns {vnode} - A virtual DOM node representing the card group layout.
 */
function layoutCards(model, layouts, searchBy) {
  return layouts.match({
    NotAsked: () => null,
    Loading: () => h('div', 'Loading...'),
    Failure: () => h('div', [h('div.alert.alert-danger', 'Unable to retrieve this list of layouts')]),
    Success: (list) => {
      if (!list || list.length <= 0) {
        return h('div', [h('.cardGrid', 'No layouts found')]);
      }
      return h(
        '.cardGrid',
        list.filter((item) => item.name.match(searchBy)).map((layout) => LayoutListCard(model, layout)),
      );
    },
  });
}
