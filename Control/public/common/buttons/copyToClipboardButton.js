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

import {h, iconClipboard} from '/js/src/index.js';
import {di} from '../../utilities/diContainer.js';

/**
 * Copy passed value to the user's clipboard
 * @param {string} value - value to be copied to user's clipboard
 * @returns {vnode}
 */
export const copyToClipboardButton = (value) => {
  if (isContextSecure()) {
    return h('button.btn.btn-sm', {
      title: 'Copy value to clipboard',
      onclick: () => {
        navigator.clipboard.writeText(value);
        di.notification.show('Successfully copied to clipboard', 'success', 1500);
      }
    }, iconClipboard())
  }
  return;
};

/**
 * Method to check if connection is secure to enable certain improvements
 * e.g navigator.clipboard, notifications, service workers
 * @return {boolean}
 */
const isContextSecure = () => {
  return window.isSecureContext;
}