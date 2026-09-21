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

import { h,
  iconPerson,
  iconMediaPlay,
  iconMediaStop,
  iconDataTransferDownload,
  iconMagnifyingGlass,
  iconPlus,
  iconMinus,
} from '/js/src/index.js';
import { BUTTON } from '../constants/button-states.const.js';
import { MODE } from '../constants/mode.const.js';

const BUTTON_TYPES_BY_MODE = {
  [MODE.QUERY]: { query: BUTTON.PRIMARY, live: BUTTON.DEFAULT, liveIcon: iconMediaPlay },
  [MODE.LIVE.RUNNING]: { query: BUTTON.DEFAULT, live: BUTTON.SUCCESS_ACTIVE, liveIcon: iconMediaStop },
  [MODE.LIVE.PAUSED]: { query: BUTTON.DEFAULT, live: BUTTON.PRIMARY, liveIcon: iconMediaPlay },
};

/**
 * Component for the command buttons (Query, Live, Clear, navigation between errors and download)
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the command buttons
 */
export const commandLogs = (model) => [
  userActionsDropdown(model),
  h('', interactionModesGroupButton(model)),
  h('', h('button.btn', { onclick: () => model.log.empty(), style: 'font-weight: bold' }, 'Clear')),
  h('.btn-group', [
    h('button.btn', {
      disabled: !model.log.list.length,
      onclick: () => model.log.firstError(),
      title: 'Go to first error/fatal (ALT + left arrow)',
    }, '|←'),
    h('button.btn', {
      disabled: !model.log.list.length,
      onclick: () => model.log.previousError(),
      title: 'Go to previous error/fatal (left arrow)',
    }, '←'),
    h('button.btn', {
      disabled: !model.log.list.length,
      onclick: () => model.log.nextError(),
      title: 'Go to next error/fatal (left arrow)',
    }, '→'),
    h('button.btn', {
      disabled: !model.log.list.length,
      onclick: () => model.log.lastError(),
      title: 'Go to last error/fatal (ALT + right arrow)',
    }, '→|'),
    h('button.btn', {
      disabled: !model.log.list.length,
      onclick: () => model.log.goToLastItem(),
      title: 'Go to last log message (ALT + down arrow)',
    }, '↓'),
  ]),
  h('', downloadButtonGroup(model.log)),
  h('', zoomButtonGroup(model.zoom)),
];

/**
 * Group of buttons for switching between Query and Live modes.
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the interaction mode buttons
 */
const interactionModesGroupButton = (model) => {
  const { frameworkInfo, log: { activeMode } } = model;

  return frameworkInfo.match({
    NotAsked: () => h('button.btn', { disabled: true }, ''),
    Loading: () => h('button.btn', { disabled: true, className: 'loading' }, 'Loading'),
    Failure: () => null,
    Success: (frameworkInfo) =>
      h('.btn-group', [
        queryButton(model, frameworkInfo, BUTTON_TYPES_BY_MODE[activeMode]),
        liveButton(model, frameworkInfo, BUTTON_TYPES_BY_MODE[activeMode]),
      ]),
  });
};

/**
 * Query button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * @param {Model} model - root model of the application
 * @param {RemoteData.payload} frameworkInfo - the payload containing framework information
 * @param {{ query: string, live: string, liveIcon: () => vnode }} type - the button type to use for the query button
 * @returns {vnode} - the view of the query button
 */
const queryButton = (model, frameworkInfo, type) => {
  const { log: logModel } = model;
  const { queryResult } = logModel;
  const { mysql: { status: { ok: isDbReady = false } = {} } = {} } = frameworkInfo;

  if (queryResult.isLoading()) {
    return h('button.btn.bold', {
      id: 'cancel-query-button',
      title: 'Cancel ongoing query',
      className: BUTTON.DANGER,
      onclick: () => logModel.cancelQuery(),
    }, 'Cancel');
  }

  return h('button.btn.bold', {
    id: 'query-button',
    title: isDbReady ? 'Query database with filters (Enter)' : 'Query service not configured',
    disabled: !isDbReady || queryResult.isLoading(),
    className: type.query,
    onclick: () => logModel.query(),
  }, 'Query');
};

/**
 * Live button final state depends on the following states
 * - services lookup
 * - services result
 * - websocket status
 * @param {Model} model - root model of the application
 * @param {RemoteData.payload} frameworkInfo - the payload containing framework information
 * @param {{ query: string, live: string, liveIcon: () => vnode }} type - the button type to use for the query button
 * @returns {vnode} - the view of the live button
 */
const liveButton = (model, frameworkInfo, type) => {
  const { log: logModel, ws } = model;
  const { queryResult } = logModel;
  const { authed: isWsAuthedAndReady = false } = ws;
  const { infoLoggerServer: { status: { ok: isLiveServiceReady = false } = {} } = {} } = frameworkInfo;

  const isLiveModeReady = isLiveServiceReady && isWsAuthedAndReady;
  const title = isLiveModeReady ? 'Stream logs with filtering' : 'Live service not configured';

  return h('button.btn.bold', {
    id: 'live-button',
    title,
    disabled: !isLiveModeReady || queryResult.isLoading(),
    className: !isLiveModeReady ? 'loading' : type.live,
    onclick: () => logModel.toggleLiveMode(),
  }, 'Live', ' ', type.liveIcon());
};

/**
 * Button dropdown to show current user and logout link
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the user actions dropdown
 */
const userActionsDropdown = (model) => h('.dropdown', { class: model.accountMenuEnabled ? 'dropdown-open' : '' }, [
  h('button.btn', { onclick: () => model.toggleAccountMenu() }, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
    infoMenuItem(model),
    model.session.personid !== 0 && saveUserProfileMenuItem(model),
  ]),
]);

/**
 * Show menu item to display framework info table
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the framework info menu item
 */
const infoMenuItem = (model) =>
  h('.menu-item', {
    onclick: () => model.toggleFrameworkInfo(),
    title: 'Show/Hide details about the framework',
  }, 'About');

/**
 * Show menu item which saves profile of the user
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the save profile menu item
 */
const saveUserProfileMenuItem = (model) =>
  h('.menu-item', {
    onclick: () => model.saveUserProfile(),
    title: 'Save the columns size and visibility as your profile',
  }, 'Save Profile');

/**
 * Group of buttons which allow the user to engage with the download functionality
 * * Download queries logs - will create a file containing all logs from the table (visible/hidden)
 * * Download visible logs only - will create a file containing only visible logs from the table
 * @param {Log} logModel - object representing the model for the log
 * @returns {vnode} - the view of the download button group
 */
const downloadButtonGroup = (logModel) =>
  h('.dropdown', { class: logModel.download.isVisible ? 'dropdown-open' : '' }, [
    h('button.btn', {
      onclick: () => {
        if (!logModel.download.isVisible) {
          logModel.generateLogDownloadContent();
        } else {
          logModel.removeLogDownloadContent();
        }
      },
    }, iconDataTransferDownload(), ' Download'),
    h('.dropdown-menu', [
      h('a.menu-item.m3.mv2.text-ellipsis', {
        href: `data:application/octet;,${encodeURIComponent(logModel.download.fullContent)}`,
        download: `InfoLog${new Date().toLocaleString()}.txt`,
        onclick: () => logModel.removeLogDownloadContent(),
      }, 'Queried Logs'),
      h('a.menu-item.m3.mv2.text-ellipsis', {
        href: `data:application/octet;,${encodeURIComponent(logModel.download.visibleOnlyContent)}`,
        download: `InfoLog${new Date().toLocaleString()}.txt`,
        onclick: () => logModel.removeLogDownloadContent(),
      }, 'Visible Logs Only'),
    ]),
  ]);

/**
 * Group of buttons for controlling log table zoom level
 * @param {Zoom} zoom - the zoom model
 * @returns {vnode} - the view of the zoom button group
 */
const zoomButtonGroup = (zoom) =>
  h('.btn-group', [
    h('button.btn', {
      onclick: () => zoom.zoomOut(),
      disabled: zoom.level <= zoom.min,
      id: 'zoom-out-button',
      title: 'Zoom out (Ctrl/Cmd + -)',
    }, h('span', { style: 'font-size:0.8em' }, iconMinus())),
    h('button.btn', {
      onclick: () => zoom.resetZoom(),
      disabled: zoom.level === 1,
      id: 'reset-zoom-button',
      title: 'Reset zoom',
    }, h('span', { style: 'font-size:0.9em' }, iconMagnifyingGlass())),
    h('button.btn', {
      onclick: () => zoom.zoomIn(),
      disabled: zoom.level >= zoom.max,
      id: 'zoom-in-button',
      title: 'Zoom in (Ctrl/Cmd + +)',
    }, h('span', { style: 'font-size:0.8em' }, iconPlus())),
  ]);
