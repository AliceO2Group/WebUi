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

import { h, imagE } from '/js/src/index.js';
import { downloadRoot, getFileExtensionFromName } from './utils.js';
import { isObjectOfTypeChecker } from '../../library/qcObject/utils.js';

/**
 * Download root image button.
 * @param {string} filename - The name of the downloaded file including its extension.
 * @param {RootObject} root - The JSROOT RootObject to render.
 * @param {string[]} [drawingOptions=[]] - Optional array of JSROOT drawing options.
 * @returns {vnode} - Download root image button element.
 */
export function downloadRootImageButton(filename, root, drawingOptions = []) {
  const filetype = getFileExtensionFromName(filename);
  return !isObjectOfTypeChecker(root) && h(`button.btn.download-root-image-${filetype}-button`, {
    title: `Download as ${filetype.toUpperCase()}`,
    onclick: async (event) => {
      try {
        event.target.disabled = true;
        await downloadRoot(filename, root, drawingOptions);
      } finally {
        event.target.disabled = false;
      }
    },
  }, imagE());
}
