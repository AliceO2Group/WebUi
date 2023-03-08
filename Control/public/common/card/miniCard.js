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

/**
 * Builds a miniCard frame and adds inside the passed children
 * @param {Array<node>|string} title - components or string to be displayed as title
 * @param {Array<vnode>} [children] - child components to be added inside the miniCard
 * @returns {vnode}
 */
export const miniCard = (title, children = []) => {
  return h('.miniCard.flex-column.shadow-level1.br2.p2.g2', [
    title && h('h4', {style: 'text-decoration:underline'}, title),
    children,
  ]);
}
