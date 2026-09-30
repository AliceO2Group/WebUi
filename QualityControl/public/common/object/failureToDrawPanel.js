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

import { h, iconWarning } from '/js/src/index.js';

/**
 * Panel to show when an object failed to be drawn
 * @param {string} error - error message to show
 * @returns {vnode} - virtual node element
 */
export const failureToDrawPanel = (error) =>h('.error-box.danger.flex-column.justify-center.f6.text-center', {}, [
  h('span.error-icon', { title: 'Error' }, iconWarning()),
  h('span', error),
]);
