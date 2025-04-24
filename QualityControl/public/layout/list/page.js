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
        .map((layout) => {
          const { description, owner_name, name, id } = layout;
          const { isOfficial } = layout;
          const isMinimumGlobal = model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
          const toggleOfficialFunction = (id, isOfficial) => model.layout.toggleOfficial(id, isOfficial);

          return h('.p2.card', [
            cardHeader(isOfficial, id, name, isMinimumGlobal, toggleOfficialFunction),
            cardBody(owner_name, description),
          ]);
        }));
    },
  });
}

/**
 * Generates the card header for a layout with interactive elements including official status toggle.
 * @param {boolean} isOfficial - Indicates if the layout currently has official status
 * @param {string} id - Unique identifier for the layout
 * @param {string} name - Display name of the layout
 * @param {boolean} isMinimumGlobal - Flag indicating if user has global minimum permissions
 * @param {Function} toggleOfficialFunction - Callback function to handle official status toggle
 * @returns {vnode} Virtual DOM node representing the layout card header
 * @example
 * // Returns a card header with official styling and toggle button
 * cardHeader(true, '123', 'My Layout', true, toggleOfficial);
 */
function cardHeader(isOfficial, id, name, isMinimumGlobal, toggleOfficialFunction) {
  const bgColor = isOfficial ? 'bg-primary' : 'bg-gray';
  const textColor = isOfficial ? 'white' : 'black';

  return h(`.cardHeader.flex-row.justify-between.${bgColor}`, [
    h('h5', [
      h(`a.${textColor}`, {
        href: `?page=layoutShow&layoutId=${id}`,
        onclick: (e) => model.router.handleLinkEvent(e),
      }, name),
    ]),
    isMinimumGlobal ?
      headerButton(isOfficial, id, toggleOfficialFunction)
      : isOfficial && h(`span.badge.${textColor}`, [iconBadge(), ' Official']),
  ]);
}

/**
 * Creates a toggle button for changing a layout's official status.
 * @param {boolean} isOfficial - Current official status of the layout
 * @param {string} id - Unique identifier of the layout to toggle
 * @param {Function} toggleOfficialFunction - Callback to execute when button is clicked
 * @returns {vnode} Button element with status-appropriate text and click handler
 * @description
 * - Button text changes between "Make Official" and "Make Unofficial"
 * - Click handler invokes the provided toggle function with layout ID and new status
 * - Includes a visual badge icon for consistency with other UI elements
 */
function headerButton(isOfficial, id, toggleOfficialFunction) {
  const officialText = isOfficial ? 'Make Unofficial' : 'Make Official';

  return h('button.btn.bg-gray-darker.white.cardHeaderButton', {
    onclick: () => toggleOfficialFunction(id, !isOfficial),
  }, [officialText, iconBadge()]);
}

/**
 * Generates the body content for a layout card.
 * @param {string} owner_name - The name of the layout owner.
 * @param {string} description - The description of the layout.
 * @returns {vnode} - A virtual DOM node for the layout's body content.
 */
function cardBody(owner_name, description) {
  return h('.cardBody.p2', [
    h('p', [
      h('strong', 'Owner: '),
      owner_name,
    ]),
    h('p', [
      h('strong', 'Description: '),
      description || '-',
    ]),
  ]);
}
