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

import { h, iconChevronLeft, iconChevronRight } from '/js/src/index.js';

/**
 * @typedef {object} VisibilityToggleButtonOptions
 * @property {string} [id] - html id property.
 * @property {string} [class] - html class property, multiple classes can be passed as a single space seperated string.
 * @property {string} [title] - title shown on hover.
 * @property {boolean} [isVisible=true] - determines which icon is rendered.
 */

/**
 * Visibility toggle button.
 * Creates an anchor element that displays an **eye** icon if visible or a **closed eye / no-eye** icon if hidden.
 * @param {VisibilityToggleButtonOptions} options - Virtual node options.
 * @param {() => void} onclick - Callback invoked when the button is clicked.
 * @returns {vnode} - Visibility toggle button vnode.
 * @example
 * visibilityToggleButton(
 *   {
 *     isVisible: objectViewModel.getObjectInfoVisible(),
 *     title: 'Toggle object information visibility',
 *   },
 *   () => {
 *     objectViewModel.toggleObjectInfoVisible();
 *   },
 * );
 */
export function visibilityToggleButton(options = {}, onclick) {
  const { isVisible = true, ...restOptions } = options;
  const mergedOptions = {
    class: `visibility-toggle-button visibility-toggle-${isVisible ? 'on' : 'off'}`,
    ...restOptions,
  };

  return h('a.btn', {
    ...mergedOptions,
    onclick,
  }, isVisible ? iconChevronRight() : iconChevronLeft());
}
