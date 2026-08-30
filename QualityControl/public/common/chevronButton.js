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
 * @typedef {object} ChevronButtonOptions
 * @property {string} [id] - html id property.
 * @property {string} [class] - html class property, multiple classes can be passed as a single space seperated string.
 * @property {string} [title] - title shown on hover.
 * @property {boolean} [isVisible=false] - shows right chevron if true, left chevron if false.
 */

/**
 * Chevron direction toggle button (forward/backward).
 * Creates an anchor element that displays a right chevron icon if forward or a left chevron icon if backward.
 * @param {() => void} onclick - Callback invoked when the button is clicked.
 * @param {ChevronButtonOptions} options - Additional options for the button element
 * @returns {vnode} - Chevron direction toggle button vnode.
 * @example
 * chevronButton(
 *   () => {
 *     objectViewModel.toggleObjectInfoVisible();
 *   },
 *   {
 *     isVisible: objectViewModel.getObjectInfoVisible(),
 *     title: 'Toggle object information visibility',
 *   },
 * );
 */
export function chevronButton(onclick, options = {}) {
  const { isVisible = false, ...restOptions } = options;
  const mergedOptions = {
    class: `chevron-button chevron-${isVisible ? 'right' : 'left'}`,
    ...restOptions,
  };

  return h('a.btn', {
    ...mergedOptions,
    onclick,
  }, isVisible ? iconChevronRight() : iconChevronLeft());
}
