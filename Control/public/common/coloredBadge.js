/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

import {h} from '/js/src/index.js';

/**
 * Return a colored cell based on a given value and mapping associated
 *
 * @param {String} value - the value to be displayed in the cell
 * @param {Object<String, String>} colorMap - map storing color based on value 
 * @return {vnode} - the colored cell
 */
export const coloredBadge = (value = '', colorMap = {}) => {
  const valueAsKey = value.split(' ').join('_');
  return h('.badge.white.f6', {
    class: `bg-${colorMap[valueAsKey] ?? 'gray'}`,
  }, value);
};
