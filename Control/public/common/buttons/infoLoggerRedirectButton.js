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

import { redirectButtonLink } from './redirectButtonLink.js';

/**
 * @typedef {InfoLoggerQueryConfiguration}
 * 
 * @param {number} run - runNumber that is to be displayed in the InfoLogger
 * @param {string} partition - partition that is to be displayed in the InfoLogger
 * @param {string} hostname - hostname from which logs are to be retrieved
 */

/**
 * Build a link displayed as a button which allows users to open InfoLogger in a new browser tab with pre-filled parameters
 * @param {InfoLoggerQueryConfiguration} environment - DTO representing an environment
 * @param {string} label - string representation of the type of infologger to be opened (FLP/EPN)
 * @returns {vnode} - button as link allowing user to open InfoLogger in a new tab
 */
export const infoLoggerButtonLink = (
  { partition, run, hostname, system, facility },
  label = 'InfoLogger',
  source = ''
) => {
  if (source) {
    let href = `${source}?q={`;
    if (run) {
      href += `"run":{"match":"${run}"},`;
    }
    if (partition) {
      href += `"partition":{"match":"${partition}"},`;
    }
    if (hostname) {
      href += `"hostname":{"match":"${hostname}"},`;
    }
    if (system) {
      href += `"system":{"match":"${system}"},`;
    }
    if (facility) {
      href += `"facility":{"match":"${facility}"},`;
    }
    if (href.slice(-1) === ',') { // remove trailing comma
      href = href.slice(0, -1);
    }
    href += '}';
    let title = `Open InfoLogger GUI`;
    return redirectButtonLink(href, label, title, true, ['ph2', 'btn', 'primary', 'w-100']);
  }
  return;
};
