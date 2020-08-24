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
import spinner from '../loader/spinner.js';

/**
 * Shows header of Framework Information
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  h('.w-50.flex-row.justify-center', [
    h('b.f4.ph2', 'About'),
    model.frameworkInfo.item.isLoading() &&
    h('.f4', spinner()),
  ]),
  h('.flex-grow')
];
