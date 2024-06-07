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
import {iconLockLocked, iconLockUnlocked} from '/js/src/icons.js';
import {DetectorLockAction} from './../common/enums/DetectorLockAction.enum.js';

/**
 * Button build with builtin logic of detector lock state which allows users to:
 * - take/release lock with/without force as admins
 * - see who owns the lock
 * 
 * When the user releases a lock, the detector also has to be unselected from the workflow.
 * @param {Model} model - root model of the application
 * @param {String} detector - detector name
 * @param {Object} lockState - lock state of the detector
 */
export const detectorLockButton = (model, detector, lockState, isIcon = false) => {
  const lockModel = model.lock;
  const isDetectorLockTaken = lockModel.isLocked(detector);

  let detectorLockHandler = null;
  let detectorLockButtonClass = '.gray-darker';

  if (isDetectorLockTaken) {
    if (lockModel.isLockedByCurrentUser(detector)) {
      detectorLockButtonClass = '.success';
      detectorLockHandler = () => {
        lockModel.actionOnLock(detector, DetectorLockAction.RELEASE, false);
        model.workflow.flpSelection.unselectDetector(detector);
      };
    } else {
      detectorLockButtonClass = '.warning.disabled.disabled-item';
    }
  } else {
    detectorLockHandler = () => lockModel.actionOnLock(detector, DetectorLockAction.TAKE, false);
  }
  const element = isIcon ? '.flex-row.items-center.actionable-icon' : 'button.btn';

  return h(`${element}.${detectorLockButtonClass}`, {
    id: `detectorLockButtonFor${detector}`,
    title: isDetectorLockTaken ? `Lock is taken by ${lockState.owner.fullName}` : 'Lock is free',
    disabled: isDetectorLockTaken && !lockModel.isLockedByCurrentUser(detector),
    onclick: detectorLockHandler,
  }, isDetectorLockTaken ? iconLockLocked() : iconLockUnlocked());
};