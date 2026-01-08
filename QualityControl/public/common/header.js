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

import { h, iconPerson, getBrowserNotificationPermission,
  requestBrowserNotificationPermissions, BrowserNotificationPermission } from '/js/src/index.js';

import { spinner } from './spinner.js';
import layoutViewHeader from '../layout/view/header.js';
import objectTreeHeader from '../object/objectTreeHeader.js';
import aboutViewHeader from '../pages/aboutView/components/aboutViewHeader.js';
import LayoutListHeader from '../pages/layoutListView/components/LayoutListHeader.js';
import { objectViewHeader } from '../pages/objectView/components/header.js';
import { filtersPanel } from './filters/filterViews.js';

/**
 * Shows header of the application, split with 3 parts:
 * - app part on left side
 * - page title on center
 * - page actions on right side
 * @param {Model} model - root model of the application
 * @returns {vnode} - header element
 */
export default (model) => {
  const specific = headerSpecific(model) || {};
  const { centerCol, rightCol, subRow } = specific;
  const id = `qcg-header-${model.page}`;
  return h('.flex-col', [
    h('.flex-row.p2.items-center', { id, key: id }, [
      commonHeader(model),
      centerCol || h('.flex-grow'),
      rightCol || h('.w-25'),
    ]),
    subRow && h('.p2', [subRow]),
    filterSpecific(model),
  ]);
};

/**
 * Shows the page specific header (center and right side)
 * @param {Model} model - root model of the application
 * @returns {{centerCol: vnode, rightCol: vnode} | null} center column and right column
 */
const headerSpecific = (model) => {
  const { filterModel, layout, object, page } = model;
  switch (page) {
    case 'layoutList': return LayoutListHeader();
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
  const { page, filterModel, layout } = model;
  if (page === 'layoutShow' && layout.editEnabled) {
    return null;
  }

  const viewModel = filterModel.getPageTargetModel();
  if (!viewModel) {
    return null;
  }

  return filtersPanel(filterModel, viewModel);
};

/**
 * Shows app header, common to all pages (profile button + app title)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const commonHeader = (model) => h('.flex-row.items-center.w-25', [
  loginButton(model),
  ' ',
  h('span.f4.gray', {
    id: 'qcgTitle',
    style: 'cursor: pointer',
    onclick: () => model.router.go('?page=layoutList'),
    title: 'Go to layouts list page',
  }, 'Quality Control'),
  model.loader.active && h('span.f4.mh1.gray', spinner()),
]);

/**
 * Shows profile button to logout or check who is the current owner of session
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const loginButton = (model) => {
  const browserNotificationPermission = getBrowserNotificationPermission();
  const notificationsAvailable = browserNotificationPermission
    && browserNotificationPermission !== BrowserNotificationPermission.DENIED;
  const runStartNotificationEnabled = model.notificationRunStartModel.getBrowserNotificationSetting();

  return h('.dropdown', {
    title: 'Login', class: model.accountMenuEnabled ? 'dropdown-open' : '',
  }, [
    h('button.btn', { onclick: () => model.toggleAccountMenu() }, iconPerson()),
    h('.dropdown-menu', [
      h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
      model.session.personid === 0 // Anonymous user has id 0
        ? h('p.m3.gray-darker', 'This instance of the application does not require authentication.')
        : h('a.menu-item', { onclick: () => alert('Not implemented') }, 'Logout'),
      h(
        'label.flex-row.g1.items-center.form-check-label',
        {
          style: `cursor: ${notificationsAvailable ? 'pointer' : 'not-allowed'};`,
        },
        [
          h(
            '.switch',
            [
              h('input', {
                onchange: async (event) => {
                  let permissionGranted = false;
                  if (event.target.checked) {
                    const permission = await requestBrowserNotificationPermissions();
                    permissionGranted = permission === BrowserNotificationPermission.GRANTED;
                  }
                  model.notificationRunStartModel.setBrowserNotificationSetting(permissionGranted);
                },
                type: 'checkbox',
                checked: runStartNotificationEnabled,
              }),
              h(`span.slider.round.bg-${
                runStartNotificationEnabled ? 'primary' : 'gray'
              }`, {
                style: `cursor: ${notificationsAvailable ? 'pointer' : 'not-allowed'};`,
              }),
            ],
          ),
          'Notify on run start',
        ],
      ),
    ]),
  ]);
};
