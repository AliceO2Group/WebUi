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
import objectTreeHeader from '../object/objectTreeHeader.js';
import aboutViewHeader from '../pages/aboutView/components/aboutViewHeader.js';
import LayoutListHeader from '../pages/layoutListView/components/LayoutListHeader.js';
import { objectViewHeader } from '../pages/objectView/components/header.js';
import { filtersPanel } from './filters/filterViews.js';
import { runModeHeader } from './runModeHeader.js';

/**
 * Shows header of the application, split with 3 parts:
 * - app part on left side
 * - page title on center
 * - page actions on right side
 * @param {Model} model - root model of the application
 * @returns {vnode} - header element
 */
export default (model) => h('.flex-col', [
  h('.flex-row.p2.items-center', [
    commonHeader(model),
    headerSpecific(model),
  ]),
  runsModeSpecific(model),
  filterSpecific(model),
]);

/**
 * Shows the page specific header (center and right side)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const headerSpecific = (model) => {
  const { layoutListModel, filterModel, layout, object, page } = model;
  switch (page) {
    case 'layoutList': return LayoutListHeader(layoutListModel);
    case 'layoutShow': return layoutViewHeader(layout, filterModel);
    case 'objectTree': return objectTreeHeader(object, filterModel);
    case 'objectView': return objectViewHeader(model);
    case 'about': return aboutViewHeader();
    default: return null;
  }
};

/**
 * Shows the page specific header (center and right side)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const filterSpecific = (model) => {
  const { page, filterModel, layout, object, objectViewModel } = model;

  if (filterModel.inRunMode && isRunModeSupported(page)) {
    return null;
  }

  switch (page) {
    case 'layoutShow': return filtersPanel(filterModel, layout);
    case 'objectTree': return filtersPanel(filterModel, object);
    case 'objectView': return filtersPanel(filterModel, objectViewModel);
    default: return null;
  }
};

/**
 * Shows the runs mode component
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const runsModeSpecific = (model) => {
  const { page, filterModel, object, layout } = model;

  if (filterModel.inRunMode && isRunModeSupported(page)) {
    switch (page) {
      case 'objectTree': return runModeHeader(filterModel, object);
      case 'layoutShow': return runModeHeader(filterModel, layout);
      default: return null;
    }
  }
  return null;
};

/**
 * Determines if a page supports run mode
 * @param {string} page - current page
 * @returns {boolean} - whether the page supports run mode
 */
const isRunModeSupported = (page) => ['objectTree', 'layoutShow'].includes(page);

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
