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

import {h, iconPerson} from '/js/src/index.js';

/**
 * Application header (left part): lockpad button and application name
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.text-left',
  {
    style: 'width: 15em'
  },
  [
    loginButton(model),
    ' ',
    h('span.f4 gray', 'Control')
  ]);

/**
 * Login button on top left
 * One click shows username and logout link if any
 * @param {Object} model
 * @return {vnode}
 */
const loginButton = (model) => h('.dropdown', {class: model.accountMenuEnabled ? 'dropdown-open' : ''}, [
  h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`, h('sup', model.session.role)),
    model.session.personid === 0 // anonymous user has id 0
      && h('p.m3.gray-darker', 'You are connected as anonymous, no authentification needed for this application.'),
    model.checkBrowserNotificationPermissions() &&
      h('a.menu-item', {onclick: () => {
        model.toggleAccountMenu();  model.requestBrowserNotificationPermissions()}
      }, 'Enable notifications'),
    model.session.personid !== 0 &&
      h('a.menu-item', {onclick: () => alert(`Not implemented`)}, 'Logout')
  ]),
]);
