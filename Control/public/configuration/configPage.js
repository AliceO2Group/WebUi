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

import {h, iconChevronBottom} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import loading from '../common/loading.js';
import errorPage from '../common/errorPage.js';
/**
 * @file Page to show configuration components (content and header)
 */

/**
 * Header of configuration page
 * Only page title with no action
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'Configuration')),
  h('.flex-grow text-right')
];

/**
 * Content of configuration page
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.configuration.cruMapByHost.match({
    NotAsked: () => null,
    Loading: () => h('.w-100.text-center', pageLoading()),
    Success: (cruMapByHost) => buildPage(model, cruMapByHost),
    Failure: (error) => h('.w-100.text-center', errorPage(error)),
  })
]);

/**
 * vnode with the configuration
 * @param {Object} model
 * @param {JSON} cruMapByHost
 * @return {vnode}
 */
const buildPage = (model, cruMapByHost) => h('.p3', [
  h('.flex-row.pv1', [
    h('h4.pv2.w-15', 'CRUs by hostname:'),
    savingConfigurationMessagePanel(model),
    saveConfigurationButton(model),
  ]),
  Object.keys(cruMapByHost).map((host) =>
    h('', [
      h('h5.panel-title.p2.flex-row', [
        h('.w-15.flex-row', [
          h('.actionable-icon', {title: 'Open/Close CRUs configuration'}, iconChevronBottom()),
          h('.w-100.ph2', host)
        ]),
      ]),
      h('.panel', [
        Object.keys(cruMapByHost[host]).map((cruId) => cruPanel(model, cruId, cruMapByHost[host][cruId]))
      ])
    ])
  ),
]);

/**
 * Panel for each CRU endpoint to allow the user to 
 * enable/disable endpoints
 * @param {Object} model
 * @param {options} options
 * @return {vnode}
 */
const cruPanel = (model, cruId, cru) => h('', {
}, [
  h('.flex-column', [
    h('h5.flex-row.p1.panel.bg-gray-lighter', [
      h('.w-5'),
      // h('.w-5.actionable-icon.text-center', {title: 'Open/Close CRUs configuration'}, iconChevronBottom()),
      h('.w-85.flex-row', [
        h('.w-25', cruId),
        linksPanel(model, cru),
      ])
    ]),
  ]),
]);

/**
 * A panel which iterate through all links in the configuration
 * and creates a checkbox for each
 * @param {Object} model
 * @param {JSON} cru
 * @return {vnode}
 */
const linksPanel = (model, cru) =>
  h('.flex-row', [
    toggleAllCheckBox(model, cru),
    Object.keys(cru.config)
      .filter((configField) => configField.match('link[0-9]{1,2}')) // select only fields from links0 to links11
      .map((link, index) => checkBox(model, `link${index}`, `#${index}`, cru.config)),
  ]);

/**
 * A checkbox which will either select or unselect
 * all checkboxes for links 0 - 11
 * @param {Object} model
 * @param {JSON} cru - reference to the currently displayed cru
 * @return {vnode}
 */
const toggleAllCheckBox = (model, cru) =>
  h('label.d-inline.f6.ph2', {
    style: 'white-space: nowrap',
    title: `Toggle selection of all links`
  }, h('input', {
    type: 'checkbox',
    checked: Object.keys(cru.config)
      .filter((configField) => configField.match('link[0-9]{1,2}')) // select only fields from links0 to links11
      .filter((key) => cru.config[key].enabled === 'true').length === 12,
    onchange: () => {
      const areAllChecked =
        Object.keys(cru.config)
          .filter((configField) => configField.match('link[0-9]{1,2}')) // select only fields from links0 to links11
          .filter((key) => cru.config[key].enabled === 'true').length === 12;
      Object.keys(cru.config)
        .filter((configField) => configField.match('link[0-9]{1,2}')) // select only fields from links0 to links11
        .forEach((key) => cru.config[key].enabled = !areAllChecked ? 'true' : 'false');
      model.configuration.notify();
    }
  }), ' Toggle All Links');

/**
 * Generate a checkbox based on title and field to change
 * @param {Object} model
 * @param {string} title
 * @param {JSON} config - reference to the configuration in CRUsMapByHost
 * @return {vnode}
 */
const checkBox = (model, key, title, config) =>
  h('label.d-inline.f6.ph2', {
    style: 'white-space: nowrap',
    title: `Toggle selection of ${key}`
  }, h('input', {
    type: 'checkbox',
    checked: config[key].enabled === 'true',
    onchange: () => {
      config[key].enabled = config[key].enabled !== 'true' ? 'true' : 'false';
      model.configuration.notify();
    }
  }), ' ' + title);

/**
 * A panel to which a successful or error message is shown,
 * informing the user about the state of the action Save
 * @param {Object} model
 * @return {vnode}
 */
const savingConfigurationMessagePanel = (model) =>
  h('.w-70.text-right', {style: 'display: flex; align-items: center; justify-content: end'},
    model.configuration.isSavingConfiguration.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: (message) => h('.success', message),
      Failure: (error) => h('.danger', error),
    })
  );

/**
 * Button to save the updated configuration
 * @param {Object} model
 * @return {vnode}
 */
const saveConfigurationButton = (model) =>
  h('.w-15.text-right', {
    style: 'display: flex; justify-content:end'
  }, h('button.btn.btn-primary', {
    onclick: () => model.configuration.saveConfiguration(),
    disabled: model.configuration.isSavingConfiguration.isLoading(),
  }, model.configuration.isSavingConfiguration.isLoading() ? loading(1.5) : 'Save')
  )