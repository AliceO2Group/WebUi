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
import { panelTitle } from './panelTitle.js';

/**
 * Returns a div element with properties for a panel title
 * @param {string | vnode} title - title to be placed for panel
 * @param {vnode} content - content to be placed within the panel
 * @returns {vnode}
 */
export const panel = (title, content) =>
  h('.w-100.panel', [
    panelTitle(title),
    content,
  ]);
