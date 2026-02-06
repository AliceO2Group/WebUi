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
import { DetectorLockState } from './../enums/DetectorLockState.enum.js';
import { DetectorLockAction } from '../enums/DetectorLockAction.enum.js';

/**
 * Button with action to no-force/force take/release lock for a detector
 * @param {Lock} lockModel - model of the lock service 
 * @param {String} detector - detector name in prefix format, e.g. "ITS", "MFT", "TST"
 * @param {object} lockState - lock state of the detector
 * @param {DetectorLockState} lockState.state - state of the lock
 * @param {DetectorLockAction} action - action to be performed
 * @param {boolean} shouldForce - if the action should be forced or not
 * @param {String} label - button label to be displayed to the user
 * @returns {vnode}
 */
export const detectorLockActionButton = (
  lockModel, detector, lockState, action, shouldForce = false, label = `${action}`
) => {
  const isFree = lockState?.state === DetectorLockState.FREE;
  const isReleaseAction = action === DetectorLockAction.RELEASE;
  const isTakeAction = action === DetectorLockAction.TAKE;
  
  let isDisabled = false;
  let titleAndAriaLabel = `${action} lock for ${detector}`;
  
  if (isFree && isReleaseAction) {
    titleAndAriaLabel = `Cannot release lock for ${detector} - lock is not taken`;
    isDisabled = true;
  } else if (isFree && isTakeAction && shouldForce) {
    titleAndAriaLabel = `Cannot force take lock for ${detector} - lock is already free`;
    isDisabled = true;
  } else if (shouldForce) {
    titleAndAriaLabel = `Force ${action} lock for ${detector}`;
  }
  
  return h('button.btn.btn-sm.btn-danger', {
    disabled: isDisabled,
    title: titleAndAriaLabel,
    'aria-label': titleAndAriaLabel,
    'aria-disabled': isDisabled ? 'true' : 'false',
    onclick: () => lockModel.actionOnLock(detector, action, shouldForce)
  }, label);
};
