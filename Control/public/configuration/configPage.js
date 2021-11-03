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

import {h, iconChevronBottom, iconChevronTop, iconChevronRight, iconCircleX, iconCircleCheck} from '/js/src/index.js';
import pageLoading from './../common/pageLoading.js';
import loading from './../common/loading.js';
import errorPage from './../common/errorPage.js';
import {detectorHeader} from './../common/detectorHeader.js';
import {userLogicCheckBox, userLogicCheckBoxForEndpoint} from './components/userLogicCheckBox.js';
import {toggleAllLinksCheckBox, toggleAllLinksCRUCheckBox, cruLinkCheckBox} from './components/linksCheckBox.js';

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
export const content = (model) => h('', [
  detectorHeader(model),
  h('.scroll-y.absolute-fill.p3', {style: 'top: 40px'},
    model.configuration.cruMapByHost.match({
      NotAsked: () => null,
      Loading: () => h('.w-100.text-center', pageLoading()),
      Success: (cruMapByHost) => buildPage(model, cruMapByHost),
      Failure: (error) => h('.w-100.text-center', errorPage(error)),
    })
  )
]);

/**
 * vnode with the configuration
 * @param {Object} model
 * @param {JSON} cruMapByHost
 * @return {vnode}
 */
const buildPage = (model, cruMapByHost) => {
  const isDataReady = model.detectors.listRemote.isSuccess()
    && model.detectors.hostsByDetectorRemote.isSuccess();
  if (isDataReady) {
    return h('', [
      h('.w-100.flex-row', [
        h('h4.pv2.w-20', 'CRUs by detector:'),
        savingConfigurationMessagePanel(model),
        h('.btn-group.w-20', {style: 'justify-content: flex-end;'}, [
          saveConfigurationButton(model),
          runRocConfigButton(model)
        ])
      ]),
      tasksMessagePanel(model),
      h('.w-100.flex-row', [
        h('.w-70'),
        h('a.w-30', {
          style: 'display:flex; justify-content: flex-end',
          href: model.configuration.getConsulConfigURL(),
          target: '_blank',
          title: 'Open Consul with the stored configuration'
        }, 'Open Stored Configuration'),
      ]),
      cruByDetectorPanel(model, cruMapByHost),
    ]);
  } else {
    return h('.w-100.text-center', errorPage('Unable to load detectors/hosts from AliECS'));
  }
};

/**
 * Build a series of panels for each detector based on the current view of the user
 * @param {Object} model
 * @returns {vnode}
 */
const cruByDetectorPanel = (model, cruMapByHost) => {
  const detectors = model.configuration.detectorPanel;
  const hostsByDetector = model.detectors.hostsByDetectorRemote.payload;
  return Object.keys(detectors)
    .filter((detector) => (detector === model.detectors.selected || model.detectors.selected === 'GLOBAL'))
    .map((detector) => {
      const hasCRUs = hostsByDetector[detector]
        && hostsByDetector[detector].filter((host) => cruMapByHost[host]).length > 0;
      return h('.w-100.pv2', [
        h('.panel-title.flex-row.pv2', [
          h('.w-30.flex-row.ph2', [
            hasCRUs && h('input', {
              type: 'checkbox',
              style: 'cursor: pointer',
              id: `${detector}Checkbox`,
              checked: model.configuration.areAllHostsForDetectorSelected(detector),
              onchange: () => model.configuration.toggleHostsByDetectorSelection(detector),
            }),
            h('label.f4.ph2.w-20', {
              for: `${detector}Checkbox`,
              style: `font-weight: bold; margin-bottom:0;${hasCRUs ? 'cursor:pointer;' : ''}`
            }, detector),
          ]),
          hasCRUs && [
            userLogicCheckBox(model, detector, 'detector', '.w-15'),
            toggleAllLinksCheckBox(model, detector, 'detector', '.w-40'),
            h('.w-15.text-right.ph2',
              h('button.btn', {
                title: `Close panel for detector ${detector}`,
                onclick: () => {
                  detectors[detector].isOpen = !detectors[detector].isOpen;
                  model.configuration.notify();
                }
              }, detectors[detector].isOpen ? iconChevronTop() : iconChevronBottom())
            ),
          ]
        ]),
        hasCRUs && detectors[detector].isOpen
        && hostsByDetector[detector]
          .filter((host) => cruMapByHost[host])
          .map((host) => cruByHostPanel(model, host, cruMapByHost[host]))
      ])
    });
};

/**
 * Build a panel
 * @param {Object} model 
 * @param {JSON} cruMapByHost 
 * @returns 
 */
const cruByHostPanel = (model, host, cruData) =>
  h('', [
    h('.panel-title-lighter.pv2.flex-row', [
      h('.w-30.flex-row.ph2', [
        h('input', {
          type: 'checkbox',
          id: `${host}Checkbox`,
          style: 'cursor: pointer',
          checked: model.configuration.selectedHosts.includes(host),
          onchange: () => model.configuration.toggleHostSelection(host),
        }),
        h('.ph2.actionable-icon', {
          title: `Open/Close list of CRUs belonging to ${host}`,
          onclick: () => {
            model.configuration.cruToggleByHost[host] = !model.configuration.cruToggleByHost[host];
            model.configuration.notify();
          }
        }, model.configuration.cruToggleByHost[host] ? iconChevronBottom() : iconChevronRight()
        ),
        h('label.w-100', {
          for: `${host}Checkbox`,
          style: `font-weight: bold; margin-bottom:0;cursor:pointer;`
        }, host)
      ]),
      userLogicCheckBox(model, host, 'host', '.w-15'),
      toggleAllLinksCheckBox(model, host, 'host', '.w-15')
    ]),
    cruData && model.configuration.cruToggleByHost[host] && h('.panel', [
      Object.keys(cruData)
        .map((cruId) => cruPanelByEndpoint(model, cruId, cruData[cruId], host))
    ])
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
  return h('.flex-column', [
    h('.flex-row.pv1.panel', {style: 'font-weight: bold'}, [
      h('.w-5.actionable-icon.text-center', {
        title: 'Open/Close CRUs configuration',
        onclick: () => {
          model.configuration.cruToggleByCruEndpoint[`${host}_${cruId}`] = !isCruInfoVisible;
          model.configuration.notify();
        }
      }, isCruInfoVisible ? iconChevronBottom() : iconChevronRight()),
      h('.w-25', cruLabel),
      linksPanel(model, cru),
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
  ]);
};

/**
 * A panel which iterate through all links in the configuration
 * and creates a checkbox for each
 * It also adds UserLogic and All Links toggles
 * @param {Object} model
 * @param {JSON} cru
 * @return {vnode}
 */
const linksPanel = (model, cru) => {
  const linksKeyList = Object.keys(cru.config).filter((configField) => configField.match('link[0-9]{1,2}')); // select only fields from links0 to links11
  if (cru.config && cru.config.cru) {
    return [
      userLogicCheckBoxForEndpoint(model, cru, '.w-15'),
      linksKeyList.length !== 0 && toggleAllLinksCRUCheckBox(model, cru, linksKeyList, '.w-15'),
      h('.w-40.flex-row.flex-wrap', [
        linksKeyList.map((link) => cruLinkCheckBox(model, link, cru.config)),
      ])
    ]
  }
  return h('.d-inline.f6.text-light', 'No configuration found for this serial:endpoint');
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
    h('.danger.w-90', 'The following errors ocurred during execution:'),
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
