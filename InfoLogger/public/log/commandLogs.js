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

import { h, iconPerson, iconMediaPlay, iconMediaStop, iconDataTransferDownload } from '/js/src/index.js';
import { BUTTON } from '../constants/button-states.const.js';
import { MODE } from '../constants/mode.const.js';
import { setBrowserTabTitle } from '../common/utils.js';

let queryButtonType = BUTTON.PRIMARY;
let liveButtonType = BUTTON.DEFAULT;
let liveButtonIcon = iconMediaPlay();

export default (model) => [
  userActionsDropdown(model),
  h('div.btn-group.mh3', [
    queryButton(model),
    liveButton(model),
  ], ''),
  h('button.btn.mh3', { onclick: () => model.log.empty(), style: 'font-weight: bold' }, 'Clear'),
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.firstError(),
    title: 'Go to first error/fatal (ALT + left arrow)',
  }, '|←'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.previousError(),
    title: 'Go to previous error/fatal (left arrow)',
  }, '←'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.nextError(),
    title: 'Go to next error/fatal (left arrow)',
  }, '→'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.lastError(),
    title: 'Go to last error/fatal (ALT + right arrow)',
  }, '→|'),
  ' ',
  h('button.btn', {
    disabled: !model.log.list.length,
    onclick: () => model.log.goToLastItem(),
    title: 'Go to last log message (ALT + down arrow)',
  }, '↓'),
  downloadButtonGroup(model.log),
];

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
 * Query button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the query button
 */
const queryButton = (model) => h('button.btn', model.frameworkInfo.match({
  NotAsked: () => ({ disabled: true }),
  Loading: () => ({ disabled: true, className: 'loading' }),
  Success: (frameworkInfo) => ({
    title: frameworkInfo.mysql && frameworkInfo.mysql.status.ok
      ? 'Query database with filters (Enter)' : 'Query service not configured',
    disabled: !frameworkInfo.mysql || !frameworkInfo.mysql.status.ok || model.log.queryResult.isLoading(),
    className: model.log.queryResult.isLoading() ? 'loading' : queryButtonType,
    style: 'font-weight: bold',
    onclick: () => toggleButtonStates(model, false),
  }),
  Failure: () => ({ disabled: true, className: 'danger' }),
}), 'Query');

/**
 * Group of buttons which allow the user to engage with the download functionality
 * * Download queries logs - will create a file containing all logs from the table (visible/hidden)
 * * Download visible logs only - will create a file containing only visible logs from the table
 * @param {Log} logModel - object representing the model for the log
 * @returns {vnode} - the view of the download button group
 */
const downloadButtonGroup = (logModel) =>
  h('.dropdown', { class: logModel.download.isVisible ? 'dropdown-open' : '' }, [
    h('button.btn.mh3', {
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
 * Live button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * - websocket status
 * @param {Model} model - root model of the application
 * @returns {vnode} - the view of the live button
 */
const liveButton = (model) => h('button.btn', model.frameworkInfo.match({
  NotAsked: () => ({ disabled: true }),
  Loading: () => ({ disabled: true, className: 'loading' }),
  Success: (frameworkInfo) => ({
    title: frameworkInfo.infoLoggerServer.status.ok ? 'Stream logs with filtering' : 'Live service not configured',
    disabled: !frameworkInfo.infoLoggerServer.status.ok || model.log.queryResult.isLoading(),
    className: !model.ws.authed ? 'loading' : liveButtonType,
    style: 'font-weight: bold',
    onclick: () => toggleButtonStates(model, true),
  }),
  Failure: () => ({ disabled: true, className: 'danger' }),
}), 'Live', ' ', liveButtonIcon);

/**
 * Method to toggle states of the buttons(Query/Live) depending on the mode the tool is running on
 * @param {Model} model - root model of the application
 * @param {boolean} wasLivePressed - flag to check if the live button was pressed
 */
function toggleButtonStates(model, wasLivePressed) {
  model.log.download.isVisible = false; // set visibility of download dropdown to false
  if (wasLivePressed) {
    switch (model.log.activeMode) {
      case MODE.QUERY:
      case MODE.LIVE.PAUSED:
        try {
          model.log.liveStart();
          setButtonsType(BUTTON.DEFAULT, BUTTON.SUCCESS_ACTIVE, iconMediaStop());
          model.log.enableAutoScroll();
          setBrowserTabTitle(`${window.ILG.name} LIVE`);
        } catch (error) {
          model.notification.show(error.toString(), 'danger', 3000);
        }
        break;
      default: // MODE.LIVE.RUNNING
        model.log.liveStop(MODE.LIVE.PAUSED);
        setBrowserTabTitle(`${window.ILG.name} LIVE PAUSED`);
        setButtonsType(BUTTON.DEFAULT, BUTTON.PRIMARY, iconMediaPlay());
        model.log.disableAutoScroll();
    }
  } else {
    model.log.query();
    setBrowserTabTitle(`${window.ILG.name} QUERY`);
    setButtonsType(BUTTON.PRIMARY, BUTTON.DEFAULT, iconMediaPlay());
  }

  /**
   * Method to change types of the buttons based on the mode being run
   * @param {string} queryType Type of the Query Button
   * @param {string} liveType Type of the Live Button
   * @param {Icon} liveIcon Icon of the Live Button
   */
  function setButtonsType(queryType, liveType, liveIcon) {
    queryButtonType = queryType;
    liveButtonType = liveType;
    liveButtonIcon = liveIcon;
  }
}
