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
import {DetectorLockState} from './../enums/DetectorLockState.enum.js';

/**
 * Button with action to force take/release lock for a detector
 * @param {Lock} lockModel - model of the lock service 
 * @param {String} detector - detector name
 * @param {DetectorLockState} lockState - lock state of the detector
 * @param {DetectorLockAction} action - action to be performed
 * @param {String} label - button label to be displayed to the user
 * @return {vnode}
 */
export const detectorLockActionButton = (lockModel, detector, lockState, action, label = `Force ${action}`) => {
  return h('button.btn.btn-sm.btn-danger', {
    disabled: lockState?.state === DetectorLockState.FREE,
    onclick: () => lockModel.actionOnLock(detector, action, true)
  }, label);
};
