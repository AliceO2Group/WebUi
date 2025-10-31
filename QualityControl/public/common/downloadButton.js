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

import { h, iconDataTransferDownload } from '/js/src/index.js';

/**
 * @typedef {object} DownloadButtonOptions
 * @property {string} id - html id property.
 * @property {string} class - html class property, multiple classes can be passed as a single space seperated string.
 * @property {string} title - title shown on hover.
 * @property {string} target - target property, defaults to '_blank'.
 * @property {string} href - href property.
 */

/**
 * Download button.
 * @param {DownloadButtonOptions} options - vnode options.
 * @param {() => void} onclick - onClick callback.
 * @returns {vnode} - Download button element.
 */
export function downloadButton(options = {}, onclick) {
  const mergedOptions = { target: '_blank', class: 'download-button', ...options };
  return h('a.btn', {
    ...mergedOptions,
    onclick,
  }, iconDataTransferDownload());
}
