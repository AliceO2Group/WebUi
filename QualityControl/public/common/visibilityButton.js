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

import { h, iconEye } from '/js/src/index.js';

/**
 * @typedef {object} VisibilityButtonOptions
 * @property {string} [id] - html id property.
 * @property {string} [class] - html class property, multiple classes can be passed as a single space seperated string.
 * @property {string} [title] - title shown on hover.
 */

/**
 * Creates a visibility toggle button with an eye icon
 * @param {() => void} onclick - Callback invoked when the button is clicked.
 * @param {VisibilityButtonOptions} options - Additional options for the button element
 * @returns {object} - Visibility toggle button vnode.
 */
export function visibilityButton(onclick, options = {}) {
  const { ...rest } = options;
  return h('a.btn', {
    ...rest,
    class: ['visibility-toggle-button', rest.class || ''].join(' ').trim(),
    onclick,
  }, iconEye());
}
