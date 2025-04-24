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
import { iconChevronBottom, iconChevronTop, iconBadge } from '/js/src/icons.js';
import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default function layouts(model) {
  return h('.scroll-y.absolute-fill', {
    style: 'display: flex; flex-direction: column',
  }, [
    Array.from(model.folder.map.values())
      .map((folder) => createFolder(model, folder)),
  ]);
}

/**
 * Method to create a folder with various layouts
 * @param {Model} model - root model of the application
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
 * @param {Model} model - root model of the application
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
 * Displays the layouts as a set of cards.
 * @param {Model} model - The root model of the application.
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
        return h('div', [h('.cardGroupRow', 'No layouts found')]);
      }
      return h('.cardGroupRow', list.filter((item) => item.name.match(searchBy))
        .map((layout) => h('.p2.card', [
          cardHeader(model, layout),
          cardBody(model, layout),
        ])));
    },
  });
}

/**
 * Generates the card header for a layout.
 * @param {Model} model - The root model of the application.
 * @param {object} layout - The layout object containing the layout data.
 * @returns {vnode} - A virtual DOM node for the layout's header.
 */
function cardHeader(model, layout) {
  const { isOfficial } = layout;
  // const isMinimumGlobal = false;
  const isMinimumGlobal = model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
  const bgColor = layout.isOfficial ? 'bg-primary' : 'bg-gray';
  const textColor = layout.isOfficial ? 'white' : 'black';

  return h(`.cardHeader.flex-row.justify-between.${bgColor}`, [
    h('h5', [
      h(`a.${textColor}`, {
        href: `?page=layoutShow&layoutId=${layout.id}`,
        onclick: (e) => model.router.handleLinkEvent(e),
      }, layout.name),
    ]),
    isMinimumGlobal ?
      headerButton(model, layout) : isOfficial && h(`span.badge.${textColor}`, [iconBadge(), ' Official']),
  ]);
}

/**
 * Generates a button to toggle a layout's official/unofficial status.
 * Only shown to users with sufficient privileges (GLOBAL access level).
 * @param {Model} model - The root model of the application.
 * @param {object} layout - The layout object containing the layout data.
 * @returns {vnode} - A virtual DOM node containing the toggle button.
 */
function headerButton(model, layout) {
  const officialText = layout.isOfficial ? 'Make Unofficial' : 'Make Official';

  return h('button.btn.bg-gray-darker.white.cardHeaderButton', {
    onclick: () => {
      model.layout.toggleOfficial(layout.id, !layout.isOfficial);
    },
  }, [officialText, iconBadge()]);
}

/**
 * Generates the body content for a layout card.
 * @param {Model} model - The root model of the application.
 * @param {object} layout - The layout object containing the layout data.
 * @returns {vnode} - A virtual DOM node for the layout's body content.
 */
function cardBody(model, layout) {
  return h('.cardBody.p2', [
    h('p', [
      h('strong', 'Owner: '),
      layout.owner_name,
    ]),
    h('p', [
      h('strong', 'Description: '),
      layout.description || '-',
    ]),
  ]);
}
