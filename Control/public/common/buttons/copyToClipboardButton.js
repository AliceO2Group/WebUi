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

/**
 * Copy passed value to the user's clipboard
 * @param {Object} model
 * @return {vnode}
 */
export const copyToClipboardButton = (model, value) => {
  if (model.isContextSecure()) {
    return h('button.btn.btn-sm', {
      title: 'Copy value to clipboard',
      onclick: () => {
        navigator.clipboard.writeText(value);
        model.notification.show('Successfully copied to clipboard', 'success', 1500);
      }
    }, iconClipboard())
  }
  return;
};
