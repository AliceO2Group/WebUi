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
import { iconBadge } from '/js/src/icons.js';

/**
 * Main layout card component
 * @param {object} layoutCardModel - The model handeling the state of this singular view
 * @returns {vnode} Complete layout card virtual DOM node
 */
export default function (layoutCardModel) {
  const { description, owner_name, id, name, isOfficial } = layoutCardModel;
  const { router } = layoutCardModel.model;
  const isMinimumGlobal = layoutCardModel.sufficientAuthority();
  const toggleOfficialFunction = () => layoutCardModel.toggleOfficial();

  return h('.card', [
    cardHeader(isOfficial, id, name, isMinimumGlobal, toggleOfficialFunction, router),
    cardBody(owner_name, description),
  ]);
}

/**
 * Generates the card header for a layout with interactive elements including official status toggle.
 * @param {boolean} isOfficial - Indicates if the layout has official status
 * @param {string} id - Unique identifier for the layout
 * @param {string} name - Display name of the layout
 * @param {boolean} isMinimumGlobal - Flag for user's global permissions
 * @param {Function} toggleOfficialFunction - Callback for official status toggle
 * @param {Function} router - router from the rout model
 * @returns {vnode} Virtual DOM node representing the layout card header
 */
function cardHeader(isOfficial, id, name, isMinimumGlobal, toggleOfficialFunction, router) {
  const bgColor = isOfficial ? 'bg-primary' : 'bg-gray';
  const textColor = isOfficial ? 'white' : 'black';
  const href = `?page=layoutShow&layoutId=${id}`;
  const clickHandler = (e) => router.handleLinkEvent(e);

  return h(`.cardHeader.flex-row.justify-between.${bgColor}`, [
    h('h5', [h(`a.${textColor}`, { href, onclick: clickHandler }, name)]),
    isMinimumGlobal ?
      headerButton(isOfficial, toggleOfficialFunction)
      : isOfficial && h(`span.badge.${textColor}`, [iconBadge(), ' Official']),
  ]);
}

/**
 * Creates a toggle button for changing a layout's official status.
 * @param {boolean} isOfficial - Current official status of the layout
 * @param {Function} toggleOfficialFunction - Callback to execute when button is clicked
 * @returns {vnode} Button element with status-appropriate text and click handler
 * @description
 * - Button text changes between "Make Official" and "Make Unofficial"
 * - Click handler invokes the provided toggle function with layout ID and new status
 * - Includes a visual badge icon for consistency with other UI elements
 */
function headerButton(isOfficial, toggleOfficialFunction) {
  const officialText = isOfficial ? 'Make Unofficial' : 'Make Official';

  return h('button.btn.bg-gray-darker.white.cardHeaderButton', {
    onclick: () => toggleOfficialFunction(),
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
