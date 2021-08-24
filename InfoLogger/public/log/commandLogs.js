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

import {h, iconPerson, iconMediaPlay, iconMediaStop, iconDataTransferDownload} from '/js/src/index.js';
import {BUTTON} from '../constants/button-states.const.js';
import {MODE} from '../constants/mode.const.js';

let queryButtonType = BUTTON.PRIMARY;
let liveButtonType = BUTTON.DEFAULT;
let liveButtonIcon = iconMediaPlay();

export default (model) => [
  userActionsDropdown(model),
  h('div.btn-group.mh3', [
    queryButton(model),
    liveButton(model)
  ], ''),
  downloadButtonGroup(model.log),
  h('button.btn.mh3', {onclick: () => model.log.empty()}, 'Clear'),
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.firstError(),
    title: 'Go to first error/fatal (ALT + left arrow)'
  }, '|←'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.previousError(),
    title: 'Go to previous error/fatal (left arrow)'
  }, '←'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.nextError(),
    title: 'Go to next error/fatal (left arrow)'
  }, '→'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.lastError(),
    title: 'Go to last error/fatal (ALT + right arrow)'
  }, '→|'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.goToLastItem(),
    title: 'Go to last log message (ALT + down arrow)'
  }, '↓')
];

/**
 * Button dropdown to show current user and logout link
 * @param {Object} model
 * @return {vnode}
 */
const userActionsDropdown = (model) => h('.dropdown', {class: model.accountMenuEnabled ? 'dropdown-open' : ''}, [
  h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
    infoMenuItem(model),
    model.session.personid !== 0 && saveUserProfileMenuItem(model),
  ]),
]);

/**
 * Show menu item to display framework info table
 * @param {Object} model
 * @return {vnode}
 */
const infoMenuItem = (model) =>
  h('.menu-item', {
    onclick: () => model.toggleFrameworkInfo(),
    title: 'Show/Hide details about the framework'
  }, 'About');

/**
 * Show menu item which saves profile of the user
 * @param {Object} model
 * @return {vnode}
 */
const saveUserProfileMenuItem = (model) =>
  h('.menu-item', {
    onclick: () => model.saveUserProfile(),
    title: 'Save the columns size and visibility as your profile'
  }, 'Save Profile');

/**
 * Query button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * @param {Object} model
 * @return {vnode}
 */
const queryButton = (model) => h('button.btn', model.frameworkInfo.match({
  NotAsked: () => ({disabled: true}),
  Loading: () => ({disabled: true, className: 'loading'}),
  Success: (frameworkInfo) => ({
    title: (frameworkInfo.mysql && frameworkInfo.mysql.status.ok)
      ? 'Query database with filters (Enter)' : 'Query service not configured',
    disabled: !frameworkInfo.mysql || !frameworkInfo.mysql.status.ok || model.log.queryResult.isLoading(),
    className: model.log.queryResult.isLoading() ? 'loading' : queryButtonType,
    onclick: () => toggleButtonStates(model, false)
  }),
  Failure: () => ({disabled: true, className: 'danger'}),
}), 'Query');

/**
 * Group of buttons which allow the user to engage with the download functionality
 * * Download queries logs - will create a file containing all logs from the table (visible/hidden)
 * * Download visible logs only - will create a file containing only visible logs from the table
 * @param {Log} log
 * @return {vnode}
 */
const downloadButtonGroup = (log) =>
  h('.dropdown', {class: log.download.isVisible ? 'dropdown-open' : ''}, [
    h('button.btn', {onclick: () => log.generateLogDownloadContent()}, iconDataTransferDownload()),
    h('.dropdown-menu', [
      log.limit < 10001 && h('a.menu-item.m3.mv2.text-ellipsis', {
        href: `data:application/octet;,${encodeURIComponent(log.download.fullContent)}`,
        download: `InfoLog${new Date().toLocaleString()}.txt`,
        onclick: () => log.removeLogDownloadContent()
      }, 'Download Queried Logs'),
      h('a.menu-item.m3.mv2.text-ellipsis', {
        href: `data:application/octet;,${encodeURIComponent(log.download.visibleOnlyContent)}`,
        download: `InfoLog${new Date().toLocaleString()}.txt`,
        onclick: () => log.removeLogDownloadContent(),
      }, 'Download Visible Logs Only')
    ])
  ]);

/**
 * Live button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * - websocket status
 * @param {Object} model
 * @return {vnode}
 */
const liveButton = (model) => h('button.btn', model.frameworkInfo.match({
  NotAsked: () => ({disabled: true}),
  Loading: () => ({disabled: true, className: 'loading'}),
  Success: (frameworkInfo) => ({
    title: frameworkInfo.infoLoggerServer.status.ok ? 'Stream logs with filtering' : 'Live service not configured',
    disabled: !frameworkInfo.infoLoggerServer.status.ok || model.log.queryResult.isLoading(),
    className: !model.ws.authed ? 'loading' : liveButtonType,
    onclick: () => toggleButtonStates(model, true)
  }),
  Failure: () => ({disabled: true, className: 'danger'}),
}), 'Live', ' ', liveButtonIcon);

/**
 * Method to toggle states of the buttons(Query/Live) depending on the mode the tool is running on
 * @param {Object} model
 * @param {boolean} wasLivePressed
 */
function toggleButtonStates(model, wasLivePressed) {
  model.log.download.isVisible = false; // set visibilty of download dropdown to false
  if (wasLivePressed) {
    switch (model.log.activeMode) {
      case MODE.QUERY:
      case MODE.LIVE.PAUSED:
        setButtonsType(BUTTON.DEFAULT, BUTTON.SUCCESS_ACTIVE, iconMediaStop());
        model.log.enableAutoScroll();
        model.log.updateLogMode(MODE.LIVE.RUNNING);
        break;
      default: // MODE.LIVE.RUNNING
        setButtonsType(BUTTON.DEFAULT, BUTTON.PRIMARY, iconMediaPlay());
        model.log.disableAutoScroll();
        model.log.updateLogMode(MODE.LIVE.PAUSED);
    }
  } else {
    setButtonsType(BUTTON.PRIMARY, BUTTON.DEFAULT, iconMediaPlay());
    model.log.updateLogMode(MODE.QUERY);
  }

  /**
   * Method to change types of the buttons based on the mode being run
   * @param {String} queryType Type of the Query Button
   * @param {String} liveType Type of the Live Button
   * @param {Icon} liveIcon Icon of the Live Button
   */
  function setButtonsType(queryType, liveType, liveIcon) {
    queryButtonType = queryType;
    liveButtonType = liveType;
    liveButtonIcon = liveIcon;
  }
}
