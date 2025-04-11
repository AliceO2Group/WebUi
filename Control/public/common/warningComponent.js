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

import {h, iconMedicalCross} from '/js/src/index.js';

/**
 * A component which displays a medical cross icon and a warning message given message
 * @param {string} warningMessage - The message to be displayed
 * @param {Array} classes - An array of class names to be added to the component
 * @returns {vnode}
 */
export const warningComponent = (warningMessage = '', classes = []) => {
  return h('.warning.flex-row', {
    class: classes.join(' '),  
    title: warningMessage
  }, [
    h('span', iconMedicalCross()),
    h('span', warningMessage),
  ]);
};
