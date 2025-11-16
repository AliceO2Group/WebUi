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

import { h, icon, iconEye } from '/js/src/index.js';

const iconNoEye = () => icon([
  // 'path' is taken from iconEye
  // eslint-disable-next-line @stylistic/js/max-len
  h('path', { d: 'M4.031 1c-2.53 0-4.031 3-4.031 3s1.501 3 4.031 3c2.47 0 3.969-3 3.969-3s-1.499-3-3.969-3zm-.031 1c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1c0-.1-.032-.191-.063-.281-.08.16-.237.281-.438.281-.28 0-.5-.22-.5-.5 0-.2.121-.357.281-.438-.09-.03-.181-.063-.281-.063z' }),
  h('line', {
    x1: '0',
    y1: '0',
    x2: '8',
    y2: '8',
    stroke: 'currentColor',
  }),
]);

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
  }, isVisible ? iconEye() : iconNoEye());
}
