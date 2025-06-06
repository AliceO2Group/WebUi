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

import { h, iconPerson } from '/js/src/index.js';

import { spinner } from './spinner.js';
import layoutViewHeader from '../layout/view/header.js';
import objectTreeHeader from '../pages/objectTreeView/component/objectTreeHeader.js';
import aboutViewHeader from '../pages/aboutView/components/aboutViewHeader.js';
import LayoutListHeader from '../pages/layoutListView/components/LayoutListHeader.js';

/**
 * Shows header of the application, split with 3 parts:
 * - app part on left side
 * - page title on center
 * - page actions on right side
 * @param {Model} model - root model of the application
 * @returns {vnode} - header element
 */
export default (model) => h('.flex-row.p2', [
  commonHeader(model),
  headerSpecific(model),
]);

/**
 * Shows the page specific header (center and right side)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const headerSpecific = (model) => {
  switch (model.page) {
    case 'layoutList': return LayoutListHeader(model.layoutListModel);
    case 'layoutShow': return layoutViewHeader(model.layout);
    case 'objectTree': return objectTreeHeader(model);
    case 'about': return aboutViewHeader();
    default: return null;
  }
};

/**
 * Shows app header, common to all pages (profile button + app title)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const commonHeader = (model) => h('.flex-grow.flex-row.items-center', [
  loginButton(model),
  ' ',
  h('span.f4.gray', 'Quality Control'),
  model.loader.active && h('span.f4.mh1.gray', spinner()),
]);

/**
 * Shows profile button to logout or check who is the current owner of session
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const loginButton = (model) =>
  h('.dropdown', {
    title: 'Login', class: model.accountMenuEnabled ? 'dropdown-open' : '',
  }, [
    h('button.btn', { onclick: () => model.toggleAccountMenu() }, iconPerson()),
    h('.dropdown-menu', [
      h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
      model.session.personid === 0 // Anonymous user has id 0
        ? h('p.m3.gray-darker', 'This instance of the application does not require authentication.')
        : h('a.menu-item', { onclick: () => alert('Not implemented') }, 'Logout'),
    ]),
  ]);
