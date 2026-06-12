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

import { h } from '/js/src/index.js';

/**
 * Shows header of list of layouts with one search input to filter them
 * @returns {{centerCol: vnode, rightCol: vnode}} - object with virtual node elements
 */
export default () => ({
  centerCol: h('.flex-grow.text-center', [h('b.f4', 'Layouts')]),
  rightCol: h('.w-25.text-right'),
});
