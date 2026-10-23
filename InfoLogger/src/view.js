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

import { h, notification } from '/js/src/index.js';

import tableFilters from './logFilter/tableFilters.js';
import commandFilters from './logFilter/commandFilters.js';
import { commandLogs } from './log/commandLogs.js';
import statusBar from './log/statusBar.js';
import inspector from './log/inspector.js';
import tableLogsHeader from './log/tableLogsHeader.js';
import tableLogsContent from './log/tableLogsContent.js';
import tableLogsScrollMap from './log/tableLogsScrollMap.js';
import aboutComponent from './about/about.component.js';
import errorComponent from './common/errorComponent.js';
import { cellContextMenu } from './log/cellContextMenu.js';
import { setBrowserTabTitle } from './common/utils.js';
import { MODE } from './constants/mode.const.js';

const BROWSER_TAB_TITLE_BY_MODE = {
  [MODE.QUERY]: 'QUERY',
  [MODE.LIVE.RUNNING]: 'LIVE',
  [MODE.LIVE.PAUSED]: 'LIVE PAUSED',
};

/**
 * Given a frameworkInfo and the active mode, it will update the browser tab title accordingly
 * @param {RemoteData} frameworkInfo - the framework information
 * @param {string} activeMode - the current mode of the application
 * @returns {void}
 */
function updateBrowserTabTitle(frameworkInfo, activeMode) {
  const instanceName = frameworkInfo.isSuccess()
    ? (frameworkInfo.payload['infoLogger-gui'].name || '').trim()
    : '';
  const prefix = instanceName ? `ILG - ${instanceName}` : 'ILG';
  setBrowserTabTitle(`${prefix} ${BROWSER_TAB_TITLE_BY_MODE[activeMode]}`);
}

/**
 * Main view of the application
 * @param {Model} model - root model of the application
 * @returns {vnode[]} - the view of the application
 */
export default (model) => [
  notification(model.notification),
  cellContextMenu(model),
  h(
    '.flex-column absolute-fill',
    {
      oncreate: () => updateBrowserTabTitle(model.frameworkInfo, model.log.activeMode),
      onupdate: () => updateBrowserTabTitle(model.frameworkInfo, model.log.activeMode),
    },
    [
      h('.shadow-level2', [
        h('header.p1.flex-row.f7.g1.justify-between', [
          h('.flex-row.g3', commandLogs(model)),
          h('.flex-row.g3', commandFilters(model)),
        ]),
        h('header.f7', tableFilters(model)),
      ]),
      h('.flex-grow.flex-row.shadow-level0.logs-container', [
        aboutComponent(model),
        logsTable(model),
        inspectorSide(model),
      ]),
      h('footer.f7', [statusBar(model)]),
    ],
  ),
];

/**
 * Component which will display a virtual table containing the logs filtered by the user
 * @param {Model} model - root model of the application
 * @returns {vnode} - the virtual table containing the logs
 */
const logsTable = (model) =>
  h('main.flex-grow.flex-column.transition-background-color', {
    className: model.log.queryResult.isLoading() ? 'bg-gray' : '',
  }, [
    // table fixed header
    tableLogsHeader(model),
    // table scrollable content
    model.log.queryResult.isFailure()
      ? errorComponent(model.log.queryResult.payload)
      : h('.flex-row.flex-grow.logs-content', [
        tableLogsContent(model),
        tableLogsScrollMap(model),
      ]),
  ]);

/**
 * Component which will display information about the log selected by the user
 * @param {Model} model - root model of the application
 * @returns {vnode} - the inspector component
 */
const inspectorSide = (model) => h('aside.sidebar', {
  style: { width: model.inspectorEnabled ? '' : '0rem' },
}, [h('.sidebar-content.scroll-y#inspector-sidebar', [inspector(model)])]);
