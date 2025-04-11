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
 * @returns {vnode}
 */
export const warningMessageOnMissingCruConfig = (warningMessage = '', classOptions = []) => {
  return h('.warning.flex-row', {
    class: classOptions.join(' '),  
    title: warningMessage
  }, [
    h('span', iconMedicalCross()),
    h('span', warningMessage),
  ]);
};
