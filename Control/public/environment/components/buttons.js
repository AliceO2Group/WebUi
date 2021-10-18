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
/* global COG */

import {h, iconCloudDownload} from '/js/src/index.js';

/**
 * Open InfoLogger in a new browser tab with run number and environment set if available
 * @param {Object} environment
 * @param {String} label
 * @return {vnode}
 */
const infoLoggerButton = (item, label = 'InfoLogger') =>
  h('a.ph2.btn.primary.w-100', {
    style: {display: !COG.ILG_URL ? 'none' : ''},
    title: `Open InfoLogger GUI with environment: ${item.id} and run ${item.currentRunNumber} set`,
    href: item.currentRunNumber ?
      `//${COG.ILG_URL}?q={"partition":{"match":"${item.id}"},"run":{"match":"${item.currentRunNumber}"}}`
      : `//${COG.ILG_URL}?q={"partition":{"match":"${item.id}"}}`,
    target: '_blank'
  }, label);

/**
* Open Bookkeeping in a new browser tab on run details page for current run
* @param {String} label
* @return {vnode}
*/
const bookkeepingButton = (label = 'Bookkeeping') =>
  h('a.ph2.btn.primary.w-100', {
    style: {display: !COG.BKP_URL ? 'none' : ''},
    title: `Open Bookkeeping GUI run statistics page`,
    href: `//${COG.BKP_URL}?page=run-overview`,
    target: '_blank'
  },label);

/**
* Open QualityControl in a new browser tab on run details page for current run
* @param {String} label
* @return {vnode}
*/
const qcgButton = (label = 'Quality Control') =>
  h('a.btn.primary.w-100', {
    style: {display: !COG.QCG_URL ? 'none' : ''},
    title: `Open Quality Control GUI`,
    href: `//${COG.QCG_URL}?page=objectTree`,
    target: '_blank'
  },label);


/**
* Button to allow the user to download a file with logs from Messos
* @param {string} href - location of the mesos log
* @return {vnode}
*/
const mesosLogButton = (href) =>
  h('a', {
    style: {display: !href ? 'none' : ''},
    title: 'Download Mesos Environment Logs',
    href: href,
    target: '_blank'
  }, h('button.btn-sm.primary', iconCloudDownload())
  );

export {infoLoggerButton, bookkeepingButton, qcgButton, mesosLogButton};