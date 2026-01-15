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

import { h, DropdownComponent, imagE } from '/js/src/index.js';
import { downloadRoot } from './utils.js';
import { isObjectOfTypeChecker } from '../../library/qcObject/utils.js';
import { SUPPORTED_ROOT_IMAGE_FILE_TYPES } from './enums/rootImageMimes.enum.js';

/**
 * Download root image button.
 * @param {string} filename - The name of the downloaded file excluding its file extension.
 * @param {RootObject} root - The JSROOT RootObject to render.
 * @param {string[]} [drawingOptions=[]] - Optional array of JSROOT drawing options.
 * @param {(visible: boolean) => void} [onVisibilityChange=()=>{}] - Callback for any change in
 * visibility of the dropdown.
 * @param {string|undefined} [uniqueIdentifier=undefined] - An unique identifier for the dropdown,
 * or the `filename` if `undefined`.
 * @returns {vnode|undefined} - Download root image button element.
 */
export function downloadRootImageDropdown(
  filename,
  root,
  drawingOptions = [],
  onVisibilityChange = () => {},
  uniqueIdentifier = undefined,
) {
  if (isObjectOfTypeChecker(root)) {
    return undefined;
  }

  const deduplicated = Object.entries(SUPPORTED_ROOT_IMAGE_FILE_TYPES).reduce(
    (acc, [key, value]) => {
      if (!acc.seen.has(value)) {
        acc.seen.add(value);
        acc.result[key] = value;
      }
      return acc;
    },
    { seen: new Set(), result: {} },
  ).result;

  const dropdownComponent = DropdownComponent(
    h('button.btn.save-root-as-image-button', { title: 'Save root as image' }, imagE()),
    Object.keys(deduplicated).map((filetype) => h('button.btn.d-block.w-100', {
      key: `${uniqueIdentifier ?? filename}.${filetype}`,
      id: `${uniqueIdentifier ?? filename}.${filetype}`,
      title: `Save root as image (${filetype})`,
      onclick: async (event) => {
        try {
          event.target.disabled = true;
          await downloadRoot(filename, filetype, root, drawingOptions);
        } finally {
          event.target.disabled = false;
          dropdownComponent.state.hidePopover();
        }
      },
    }, filetype)),
    { onVisibilityChange },
  );

  return dropdownComponent;
}
