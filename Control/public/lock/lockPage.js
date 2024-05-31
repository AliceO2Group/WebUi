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
import {detectorHeader} from '../common/detectorHeader.js';
import {detectorLockActionButton} from './../common/detectorLock/detectionLockActionButton.js';
import {detectorLockButton} from './lockButton.js';
import {ROLES} from './../workflow/constants.js';
import errorPage from './../common/errorPage.js';
import loading from './../common/loading.js';
import {DetectorLockAction} from '../common/enums/DetectorLockAction.enum.js';

const LOCK_TABLE_HEADER_KEYS = ['Detector', 'Owner'];

/**
 * @file Page that displays detector lock details, states and allows users to take / release one or multiple locks
 */

/**
 * Header of the lock page
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-100.text-center', [
    h('h4', 'Locks')
  ]),
  model.detectors.selected === 'GLOBAL' && h('.flex-row.text-right', {
    style: 'position: absolute; right: 0px;'
  })
];

/**
 * Content - displays table with detector locks and associated actions
 * @param {Model} model - root model of the application
 * @return {vnode}
 */
export const content = (model) => {
  const padlockState = model.lock.padlockState;
  return [
    detectorHeader(model),
    h('.text-center.scroll-y.absolute-fill', {style: 'top: 40px'}, [
      padlockState.match({
        NotAsked: () => null,
        Loading: () => loading(3),
        Failure: (error) => errorPage(error),
        Success: (detectorsLocksState) => h('.flex-column',[
          detectorLocksTable(model, detectorsLocksState)
        ])
      })
    ])
  ]
};

/**
 * Table with lock status details, buttons to lock them, and admin actions such us "Force release"
 * @param {Model} model - root model of the application
 * @param {Object<String, DetectorLock>} detectorsLockState - state of the detectors lock
 * @return {vnode}
 */
const detectorLocksTable = (model, detectorLocksState) => {
  return h('table.table.table-sm',
    h('thead',
      h('tr',
        LOCK_TABLE_HEADER_KEYS.map((header) => h('th', header)),
        model.isAllowed(ROLES.Admin) && h('th', 'Admin actions')
      )
    ),
    h('tbody', [
      Object.keys(detectorLocksState).map((detector) => {
        const isDetectorAvailableToCurrentUser = (
          (model.isAllowed(ROLES.Global) &&
            (model.detectors.selected === 'GLOBAL' || model.detectors.selected === detector)
          ) || model.detectors.authed.includes(detector));
        if (isDetectorAvailableToCurrentUser) {
          return detectorLockRow(model, detector, detectorLocksState[detector]);
        }
        return;
      }),
    ])
  );
};

/**
 * Build a vnode for a row in the detector lock table which contains state of the lock and owner
 * @param {Model} model - root model of the application
 * @param {String} detector - detector name
 * @param {DetectorLock} lockState - state of the lock  {owner: {fullName: String}, isLocked: Boolean
 * @return {vnode}
 */
const detectorLockRow = (model, detector, lockState) => {
  const ownerName = lockState?.owner?.fullName || '-';
  return h('tr', {
    id: `detector-row-${detector}`,
  }, [
    h('td',
      h('.flex-row.g2.items-center.f5', [
        detectorLockButton(model, detector, lockState),
        detector
      ])
    ),
    h('td', ownerName),
    model.isAllowed(ROLES.Admin) && h('td', [
      detectorLockActionButton(model, detector, lockState, DetectorLockAction.RELEASE, 'Force Release'),
      detectorLockActionButton(model, detector, lockState, DetectorLockAction.TAKE, 'Force Take')
    ])
  ]);
};
