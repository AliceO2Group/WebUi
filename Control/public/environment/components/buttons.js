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

import { h, iconCloudDownload } from '/js/src/index.js';

/**
 * Build a link displayed as a button which allows users to open InfoLogger in a new browser tab with run number and environment set if available
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @param {string} label - string representation of the type of infologger to be opened (FLP/EPN)
 * @param source
 * @returns {vnode}
 */
const infoLoggerButton = ({ id, currentRunNumber }, label = 'InfoLogger', source = '') => {
  if (source) {
    const title = currentRunNumber ? `Open InfoLogger GUI with partition: ${id} and run: ${currentRunNumber}`
      : `Open InfoLogger GUI with partition: ${id}`;
    const href = currentRunNumber ? `${source}?q={"partition":{"match":"${id}"},"run":{"match":"${currentRunNumber}"}}`
      : `${source}?q={"partition":{"match":"${id}"}}`;
    return h('a.ph2.btn.primary.w-100', {
      title,
      href,
      target: '_blank',
    }, label);
  }
  return;
};

/**
 * Button to allow the user to download a file with logs from Messos
 * @param {string} href - location of the mesos log
 * @returns {vnode}
 */
const mesosLogButton = (href) =>
  h('a', {
    style: { display: !href ? 'none' : '' },
    title: 'Download Mesos Environment Logs',
    href,
    target: '_blank',
  }, h('button.btn-sm.primary', iconCloudDownload()));

export { infoLoggerButton, mesosLogButton };
