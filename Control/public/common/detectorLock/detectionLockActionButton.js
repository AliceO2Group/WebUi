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
 * @param {Model} model - root model of the application
 * @param {String['TAKE', 'RELEASE']} action - action to be performed
 * @param {String} label - button label
 * @return {vnode}
 */
export const detectorLockActionButton = (model, detector, lockState, action, label = `Force ${action}`) => {
  return h('button.btn.btn-sm.btn-danger', {
    disabled: lockState.state === DetectorLockState.FREE,
    onclick: () => model.lock.actionOnLock(detector, action, true)
  }, label);
};


