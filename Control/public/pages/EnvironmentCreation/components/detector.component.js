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

import {h, iconLockLocked, iconLockUnlocked} from '/js/src/index.js';

/**
 * Returns the component representing a detector details and selection. It allows the user to:
 * - take lock of detector / see details of lock if taken by another user
 * - once lock is acquired, select detector to use for env creation
 *
 * @param {DetectorAvailability} detector - state of the detector
 * @param {void} callback - action needed to lock/unlock a detector
 * @param {void} callback - detector selection action
 * @return {vnode} - a single detector component
 */
export const detectorComponent =
  (detector, lockCallback, selectionCallback) => {
    const {name, isLockedBy, isActive} = detector;
    return h('.text-center.f3.shadow-level1.flex-row', {
      id: `${name}-detector`,
      key: `${name}-detector`,
    }, [
      h('.w-40', detectorLock(name, isLockedBy, undefined, lockCallback)),
      // h('.w-60', detectorSelection(detector, undefined, isLockedBy && isCurrentOwner, isActive, selectionCallback))
    ])
  };

/**
 * Builds a lock component representing the state of the detector
 * @param {boolean} isLocked - state of the detector
 * @param {boolean} isCurrentOwner - if the current user is the owner of the lock 
 * @param {void} callback - action needed to lock/unlock a detector
 * @returns {vnode}
 */
const detectorLock = (detector, isLocked, isCurrentOwner, callback) => {
  let classList = ['actionable-icon'];
  if (isLocked && isCurrentOwner) {
    classList = ['actionable-icon', 'success'];
  } else if (!isCurrentOwner) {
    classList = ['disabled-item', 'warning'];
  }
  return h('', {
    id: `${detector}Lock`,
    class: classList.join(' '),
    style: {
      cursor: 'pointer'
    },
    onclick: () => isLocked && isCurrentOwner && callback(),
  }, isLocked ? iconLockLocked() : iconLockUnlocked());
};

/**
 * Builds a detector component which will allow the user to select the detector if user has the lock for it
 * @param {string} detector - name of the detector
 * @param {boolean} isSelected - if detector is already selected in the UI
 * @param {boolean} isLockedByCurrentUser - if detector is locked by the person trying to select it
 * @param {boolean} isActive - if detector is active, no selection will be allowed
 * @param {void} callback - detector selection action
 * @returns 
 */
const detectorSelection = (detector, isSelected, isLockedByCurrentUser, isActive, callback) => {
  if (isActive || !isLockedByCurrentUser) {
    return h('.disabled-item', {
      title: 'Detector is not locked or is currently in use'
    }, detector)
  }
  let classList = ['actionable-icon'];
  if (isSelected) {
    classList.push('bg-primary');
    classList.push('white')
  }
  return h('', {
    class: classList.join(' '),
    onclick: () => isLockedByCurrentUser && !isActive && callback()
  },
  detector);
};
