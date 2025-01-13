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

import {h,CopyToClipboardComponent,DropdownComponent } from '/js/src/index.js';
import { iconCaretBottom } from '/js/src/icons.js';
/**
 * Build a component which a dropdown with values and provides a copy to clipboard actionable icon
 * @param {String|vnode} text - text to be displayed
 * @param {String} type - type of the text
 * @param {Array} options - options for the dropdown
 * @return {vnode}
 */
export const DropdownCopyValue = (text, type,options) =>
  h('.flex-row.gc2', [
    h(`${type}`, text),
    DropdownComponent(
      h('.btn.btn-group-item.last-item', iconCaretBottom()),
      h(
        '.flex-column.p2.g3',
        [
          options.map((option) =>
            h(CopyToClipboardComponent, { value: option.value, id: option.value }, option.label)
          )
        
        ],
      ),
    ),
    // h(CopyToClipboardComponent, { value: url, id: log.id }, 'Copy Link')
  ]);
