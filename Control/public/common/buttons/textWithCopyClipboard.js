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

import {h} from '/js/src/index.js';
import { copyToClipboardIcon } from './copyToClipboardIcon.js';

/**
 * Build a component which displays some text and provides a copy to clipboard actionable icon
 * @param {String|vnode} text - text to be displayed
 * @return {vnode}
 */
export const textWithCopyClipboard = (text, type) =>
  h('.flex-row.gc2', [
    h(`${type}`, text),
    copyToClipboardIcon(text),
  ]);
