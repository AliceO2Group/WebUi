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

import {h, iconPerson, iconMediaPlay, iconMediaStop} from '/js/src/index.js';

import spinner from '../loader/spinner.js';
import layoutShowHeader from '../layout/layoutShowHeader.js';
import layoutListHeader from '../layout/layoutListHeader.js';
import objectTreeHeader from '../object/objectTreeHeader.js';
import frameworkInfoHeader from '../frameworkInfo/frameworkInfoHeader.js';

/**
 * Shows header of the application, split with 3 parts:
 * - app part on left side
 * - page title on center
 * - page actions on right side
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.flex-row.p2', [
  commonHeader(model),
  headerSpecific(model)
]);

let onlineButtonIcon = iconMediaPlay();
let onlineButtonStyle = 'btn-default';
/**
 * Shows the page specific header (center and right side)
 * @param {Object} model
 * @return {vnode}
 */
const headerSpecific = (model) => {
  switch (model.page) {
    case 'layoutList': return layoutListHeader(model);
    case 'layoutShow': return layoutShowHeader(model);
    case 'objectTree': return objectTreeHeader(model);
    case 'about': return frameworkInfoHeader(model);
    default: return null;
  }
};

/**
 * Shows app header, common to all pages (profile button + app title)
 * @param {Object} model
 * @return {vnode}
 */
const commonHeader = (model) => h('.flex-grow', [
  loginButton(model),
  ' ',
  onlineButton(model),
  ' ',
  h('span.f4.gray', 'Quality Control'),
  model.loader.active && h('span.f4.mh1.gray', spinner())
]);

/**
 * Shows profile button to logout or check who is the current owner of session
 * @param {Object} model
 * @return {vnode}
 */
const loginButton = (model) =>
  h('.dropdown', {
    title: 'Login', class: model.accountMenuEnabled ? 'dropdown-open' : ''
  }, [
    h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
    h('.dropdown-menu', [
      h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
      model.session.personid === 0 // anonymous user has id 0
        ? h('p.m3.gray-darker', 'This instance of the application does not require authentication.')
        : h('a.menu-item', {onclick: () => alert(`Not implemented`)}, 'Logout'),
    ]),
  ]);

/**
 * Create button which will allow user to enable/disable online mode
 * @param {Object} model
 * @return {vnode}
 */
const onlineButton = (model) => h('button.btn',
  {
    className: onlineButtonStyle,
    onclick: () => toggleOnlineButton(model),
    disabled: model.object.queryingObjects ? true : false,
    title: model.object.queryingObjects ? 'Toggling disabled while querying' : 'Toggle Mode (Online/Offline)',
    style: model.isOnlineModeConnectionAlive ? '' : 'display: none'
  },
  'Online',
  ' ',
  onlineButtonIcon
);

/**
 * Action to disable/enable online mode
 * @param {Object} model
 */
function toggleOnlineButton(model) {
  model.toggleMode();
  switch (model.isOnlineModeEnabled) {
    case true:
      onlineButtonStyle = 'btn-success';
      onlineButtonIcon = iconMediaStop();
      break;
    default:
      onlineButtonStyle = 'btn-default';
      onlineButtonIcon = iconMediaPlay();
  }
}
