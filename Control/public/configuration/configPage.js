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

import {h, iconChevronBottom, iconChevronRight, iconCircleX, iconCircleCheck} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import loading from '../common/loading.js';
import errorPage from '../common/errorPage.js';
/**
 * @file Page to show configuration components (content and header)
 */

/* global COG */

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
  h('.w-100.flex-row.pv1', [
    h('h4.pv2.w-20', 'CRUs by hostname:'),
    savingConfigurationMessagePanel(model),
    h('.btn-group.w-20', {style: 'justify-content: flex-end;'}, [
      saveConfigurationButton(model),
      runRocConfigButton(model)
    ])
  ]),
  tasksMessagePanel(model),
  h('.w-100', {style: 'display: flex;'}, [
    h('.w-70.ph2.flex-row', [
      h('.w-40', [
        h('input', {
          type: 'checkbox',
          id: 'allHostsSelector',
          style: 'cursor: pointer',
          checked: model.configuration.selectedHosts.length === Object.keys(cruMapByHost).length,
          onchange: () => model.configuration.toggleAllSelection(),
        }),
        h('label.d-inline.f6.ph1', {
          for: 'allHostsSelector', style: 'cursor: pointer;white-space: nowrap', title: `Toggle selection of all hosts`
        }, 'Toggle All Hosts'),
      ]),
      h('.ph2.w-50', [
        h('input', {
          type: 'checkbox',
          id: 'allHostsUserLogicSelector',
          style: 'cursor: pointer',
          checked: model.configuration.areAllUserLogicsEnabled(),
          onchange: () => model.configuration.toggleAllHostsUserLogicSelection(),
        }),
        h('label.d-inline.f6.ph1', {
          for: 'allHostsUserLogicSelector',
          style: 'cursor: pointer;white-space: nowrap',
          title: `Toggle User Logic for All Hosts`
        }, 'Toggle User Logic for All Hosts')
      ]),
    ]),
    h('a.w-30', {
      style: 'display:flex; justify-content: flex-end',
      href: model.configuration.getConsulConfigURL(),
      target: '_blank',
      title: 'Open Consul with the stored configuration'
    }, 'Open Stored Configuration'),
  ]),
  Object.keys(cruMapByHost).map((host) =>
    h('', [
      h('h5.panel-title.p2.flex-row', [
        h('.flex-row', [
          h('input', {
            type: 'checkbox',
            checked: model.configuration.selectedHosts.includes(host),
            onchange: () => model.configuration.toggleHostSelection(host),
          }),
          h('.ph2.actionable-icon', {
            title: 'Open/Close CRUs configuration',
            onclick: () => {
              model.configuration.cruToggleByHost[host] = !model.configuration.cruToggleByHost[host];
              model.configuration.notify();
            }
          }, model.configuration.cruToggleByHost[host] ? iconChevronBottom() : iconChevronRight()
          ),
          h('.w-100', host)
        ]),
      ]),
      model.configuration.cruToggleByHost[host] && h('.panel', [
        Object.keys(cruMapByHost[host])
          .map((cruId) => cruPanelByEndpoint(model, cruId, cruMapByHost[host][cruId], host))
      ])
    ])
  ),
]);

/**
 * Panel for each CRU endpoint to allow the user to 
 * enable/disable endpoints
 * @param {Object} model
 * @param {string} cruId
 * @param {JSON} cru
 * @param {string} host
 * @return {vnode}
 */
const cruPanelByEndpoint = (model, cruId, cru, host) => {
  const cruLabel = `${cru.info.serial}:${cru.info.endpoint}`;
  let isCruInfoVisible = model.configuration.cruToggleByCruEndpoint[`${host}_${cruId}`];
  return h('', {
  }, [
    h('.flex-column', [
      h('.flex-row.p1.panel.bg-gray-lighter', {style: 'font-weight: bold'}, [
        h('.w-5.actionable-icon.text-center', {
          title: 'Open/Close CRUs configuration',
          onclick: () => {
            model.configuration.cruToggleByCruEndpoint[`${host}_${cruId}`] = !isCruInfoVisible;
            model.configuration.notify();
          }
        }, isCruInfoVisible ? iconChevronBottom() : iconChevronRight()),
        h('.w-95.flex-row', [
          h('.w-25', cruLabel),
          linksPanel(model, cru),
        ])
      ]),
      isCruInfoVisible && h('.flex-row.p1.panel.bg-white', [
        h('.w-5', []),
        h('.w-95.flex-row.flex-wrap', [
          Object.keys(cru.info).map((key) =>
            h('.w-25.flex-row', [
              h('.w-60.w-wrapped', {style: 'font-weight: bold'}, key),
              h('.w-40.w-wrapped', cru.info[key]),
            ])
          )
        ])
      ]),
    ]),
  ])
};

/**
 * A panel which iterate through all links in the configuration
 * and creates a checkbox for each
 * @param {Object} model
 * @param {JSON} cru
 * @return {vnode}
 */
const linksPanel = (model, cru) => {
  const linksKeyList = Object.keys(cru.config).filter((configField) => configField.match('link[0-9]{1,2}')); // select only fields from links0 to links11
  if (cru.config && cru.config.cru) {
    return h('.flex-row.w-75', [
      h('.w-15', toggleUserLogic(model, cru)),
      linksKeyList.length !== 0 && h('.w-15', toggleAllCheckBox(model, cru, linksKeyList)),
      h('.w-70.flex-row.flex-wrap', [
        linksKeyList.map((link) => checkBox(model, link, cru.config)),
      ])
    ])
  }
  return h('.d-inline.f6.text-light', 'No configuration found for this serial:endpoint');
};

/**
 * Add a checkbox for the user to enable/disable the user logic
 * Based on this selection the links panel will be hidden
 * @param {Object} model
 * @param {JSON} cru
 * @returns {vndoe}
 */
const toggleUserLogic = (model, cru) =>
  h('label.d-inline.f6', {
    style: 'white-space: nowrap',
    title: `Toggle selection of User Logic`
  }, h('input', {
    type: 'checkbox',
    checked: cru.config.cru.userLogicEnabled === 'true',
    onchange: () => {
      cru.config.cru.userLogicEnabled = cru.config.cru.userLogicEnabled === 'true' ? 'false' : 'true';
      model.configuration.notify();
    }
  }), ' User Logic');

/**
 * A checkbox which will either select or unselect
 * all checkboxes for links 0 - 11
 * @param {Object} model
 * @param {JSON} cru - reference to the currently displayed cru
 * @return {vnode}
 */
const toggleAllCheckBox = (model, cru, linksList) =>
  h('label.d-inline.f6.ph2', {
    style: 'white-space: nowrap',
    title: `Toggle selection of all links`
  }, h('input', {
    type: 'checkbox',
    checked: linksList.filter((key) => cru.config[key].enabled === 'true').length === linksList.length,
    onchange: () => {
      const areAllChecked = linksList.filter((key) => cru.config[key].enabled === 'true').length === linksList.length;
      linksList.forEach((key) => cru.config[key].enabled = !areAllChecked ? 'true' : 'false');
      model.configuration.notify();
    }
  }), ' All Links');

/**
 * Generate a checkbox based on title and field to change
 * @param {Object} model
 * @param {string} key - format link0
 * @param {JSON} config - reference to the configuration in CRUsMapByHost
 * @return {vnode}
 */
const checkBox = (model, key, config) => {
  let id = '-';
  try {
    id = '#' + key.split('link')[1];
  } catch (error) {
    id = key;
  }
  return h('label.d-inline.f6.ph2', {
    style: 'white-space: nowrap',
    title: `Toggle selection of ${key}`
  }, h('input', {
    type: 'checkbox',
    checked: config[key].enabled === 'true',
    onchange: () => {
      config[key].enabled = config[key].enabled !== 'true' ? 'true' : 'false';
      model.configuration.notify();
    }
  }), ' ' + id);
};

/**
 * Builds a panel under the command buttons to display failed tasks information
 * This panel only appears if there are any failed tasks
 * @param {Object} model
 * @returns {vnode}
 */
const tasksMessagePanel = (model) =>
  model.configuration.failedTasks.length > 0 &&
  h('.w-100.p2', {
    style: 'border: 1px solid #ddd;'
  }, [
    h('.danger.w-90', 'The following errors occured during execution:'),
    model.configuration.failedTasks.map((task) =>
      (task.id && task.host) ? h('.danger.flex-row', [
        '- task id:',
        h('.ph1', {style: 'font-weight: bold'}, task.id),
        'on host:',
        h('.ph1', {style: 'font-weight: bold'}, task.host),
      ]) :
        h('.danger.flex-row', [
          '- environment error: ',
          h('.ph1', {style: 'font-weight: bold'}, task.message),
        ])
    ),
    h('.danger.flex-row.w-100', [
      'Please check ',
      h('a.ph2', {
        style: {display: !COG.ILG_URL ? 'none' : ''},
        title: 'Open InfoLogger',
        href: `//${COG.ILG_URL}`,
        target: '_blank'
      }, 'infologger'
      ),
      'for more information.'
    ]),
  ]);

/**
 * A panel to which a successful or error message is shown,
 * informing the user about the state of the action Save
 * @param {Object} model
 * @return {vnode}
 */
const savingConfigurationMessagePanel = (model) =>
  h('.w-70.text-right', {style: 'display: flex; align-items: center; justify-content: flex-end'},
    model.configuration.configurationRequest.match({
      NotAsked: () => null,
      Loading: () => null,
      Success: (message) => h('.flex-row', {
        class: message.ended ? (message.success ? 'success' : 'danger') : '',
      }, [
        !message.ended ?
          h('.pv1', pageLoading(1.5))
          : (message.success ? h('.pv2.ph2.text-center', iconCircleCheck()) : h('.pv2.ph4.text-center', iconCircleX())),
        h('.w-100.p2', message.info.message),
      ]),
      Failure: (error) => h('.danger', [iconCircleX(), ' ', error.message || error]),
    })
  );

/**
 * Button to save the updated configuration
 * @param {Object} model
 * @return {vnode}
 */
const saveConfigurationButton = (model) =>
  h('button.btn.btn-default', {
    onclick: () => model.configuration.saveConfiguration(),
    disabled: model.configuration.configurationRequest.isLoading(),
  }, model.configuration.configurationRequest.isLoading() ? loading(1.5) : 'Save');

/**
 * Button to save the updated configuration
 * @param {Object} model
 * @return {vnode}
 */
const runRocConfigButton = (model) =>
  h('button.btn.btn-primary', {
    onclick: () => {
      confirm(`Cards will be FULLY configured with Consul stored configuration.
Thus, all parameters will be provided to o2-roc-config and NOT only the links.
Are you sure you would like to continue?`)
        && model.configuration.saveAndConfigureCRUs()
    },
    disabled: model.configuration.configurationRequest.isLoading(),
  }, model.configuration.configurationRequest.isLoading() ? loading(1.5) : 'Save & Configure');
