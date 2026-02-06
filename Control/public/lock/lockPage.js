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
import {isUserAllowedRole} from './../common/userRole.js';
import { getDetectorListWithTstAtEnd, TST_DETECTOR_NAME } from '../common/detectorUtils.js';
import { DetectorState, DetectorStateStyle } from '../common/enums/DetectorState.enum.js';

const LOCK_TABLE_HEADER_KEYS = ['Detector', 'Owner', 'Active'];
const DETECTOR_ALL = 'ALL';

/**
 * @file Page that displays detector lock details, states and allows users to take / release one or multiple locks
 */

/**
 * Header of the lock page
 * @return {vnode}
 */
export const header = () => [
  h('.w-100.text-center', [
    h('h4', 'Locks')
  ]),
];

/**
 * Content - displays table with detector locks and associated actions
 * @param {Model} model - root model of the application
 * @return {vnode}
 */
export const content = (model) => {
  const {lock: lockModel, detectors: detectorsService} = model;
  const { padlockState } = lockModel;
  return [
    detectorHeader(model),
    h('.text-center.scroll-y.absolute-fill', {
      style: 'top: 40px',
      oncreate: () => detectorsService.getActiveDetectors(),
    }, [
      padlockState.match({
        NotAsked: () => null,
        Loading: () => loading(3),
        Failure: (error) => errorPage(error),
        Success: (detectorsLocksState) => h('.flex-column', [
          detectorsService.isGlobalView() && [
            h('.flex-row.g2.p2', [
              isUserAllowedRole(ROLES.Admin) && [
                h('strong', 'Admin actions: '),
                detectorLockActionButton(
                  lockModel, DETECTOR_ALL, {}, DetectorLockAction.RELEASE, true, 'Force Release ALL'
                ),
                detectorLockActionButton(
                  lockModel, DETECTOR_ALL, {}, DetectorLockAction.TAKE, true, 'Force Take ALL'
                ),
              ],
              isUserAllowedRole(ROLES.Global) && [
                h('strong', 'Global actions: '),
                detectorLockActionButton(
                  lockModel, DETECTOR_ALL, {}, DetectorLockAction.RELEASE, false, 'Release ALL*'
                ),
                detectorLockActionButton(
                  lockModel, DETECTOR_ALL, {}, DetectorLockAction.TAKE, false, 'Take ALL*'
                ),
              ],
            ]),
          ],
          detectorLocksTable(model, detectorsLocksState, detectorsService.activeDetectors)
        ])
      })
    ])
  ]
};

/**
 * Table with lock status details, buttons to lock them, and admin actions such us "Force release"
 * @param {Model} model - root model of the application
 * @param {Object<String, DetectorLock>} detectorsLockState - state of the detectors lock
 * @param {RemoteData} activeDetectorsRemote - remote data with the list of active detectors
 * @return {vnode}
 */
const detectorLocksTable = (model, detectorLocksState, activeDetectorsRemote) => {
  const { detectors: detectorsService, lock: lockModel } = model;
  const isUserGlobal = isUserAllowedRole(ROLES.Global);
  const detectorKeysWithTstLast = getDetectorListWithTstAtEnd(Object.keys(detectorLocksState));
  const detectorRows = detectorKeysWithTstLast
    .filter((detectorName) => {
      const isSelectedDetectorViewGlobalOrCurrent = (
        detectorsService.isGlobalView() || detectorsService.selected === detectorName
      );
      const isUserAllowedDetector = detectorsService.authed.includes(detectorName);
      return (isUserGlobal && isSelectedDetectorViewGlobalOrCurrent) || isUserAllowedDetector;
    })
    .map((detectorName) => {
      const detectorActivityState = _getDetectorState(activeDetectorsRemote, detectorName);
      if (detectorName.toLocaleUpperCase().includes(TST_DETECTOR_NAME)) {
        return [
          emptyRowSeparator(),
          detectorLockRow(lockModel, detectorName, detectorLocksState[detectorName], detectorActivityState)
        ];
      } else {
        return detectorLockRow(lockModel, detectorName, detectorLocksState[detectorName], detectorActivityState)
      }
    });
  return h('table.table.table-sm',
    h('thead',
      h('tr',
        LOCK_TABLE_HEADER_KEYS.map((header) => h('th', header)),
        isUserAllowedRole(ROLES.Global) && h('th', 'Global actions')
      )
    ),
    h('tbody', [
      detectorRows.length > 0
        ? detectorRows
        : h('tr',
          h('td.ph2.warning', { colspan: LOCK_TABLE_HEADER_KEYS.length } , [
            'Missing Role permissions needed for being allowed to own locks',
            ' If you have just started your shift, please allow a few minutes for the system ',
            'to update before trying again or calling an FLP expert.'
          ])
        )
    ])
  );
};

/**
 * Build a vnode for a row in the detector lock table which contains state of the lock and owner
 * @param {LockModel} lockModel - model of the lock state and actions
 * @param {String} detector - detector name
 * @param {DetectorLock} lockState - state of the lock  {owner: {fullName: String}, isLocked: Boolean
 * @param {DetectorState} detectorActivityState - state of the detector as per AliECS (Active, Inactive, Unknown)
 * @return {vnode}
 */
const detectorLockRow = (lockModel, detector, lockState, detectorActivityState) => {
  const ownerName = lockState?.owner?.fullName || '-';
  return h('tr', {
    id: `detector-row-${detector}`,
  }, [
    h('td',
      h('.flex-row.g2.items-center.f5', [
        detectorLockButton(lockModel, detector, lockState, false, detectorActivityState === DetectorState.ACTIVE),
        detector
      ])
    ),
    h('td', ownerName),
    h(`td`, {
      class: DetectorStateStyle[detectorActivityState]
    }, detectorActivityState),
    isUserAllowedRole(ROLES.Global) && h('td', [
      detectorLockActionButton(lockModel, detector, lockState, DetectorLockAction.RELEASE, true, 'Force Release'),
      detectorLockActionButton(lockModel, detector, lockState, DetectorLockAction.TAKE, true, 'Force Take')
    ])
  ]);
};

/**
 * Empty table row separator vnode
 * @return {vnode}
 */
const emptyRowSeparator = () => h('tr', h('td', {colspan: LOCK_TABLE_HEADER_KEYS.length}, h('hr')));

/**
 * Helper function to get the state of the detector (Active, Inactive, Unknown) based on the activeDetectorsRemote data
 * @param {RemoteData} activeDetectorsRemote - remote data with the list of active detectors
 * @param {String} detectorName - name of the detector to get the state for
 * @return {String} state of the detector (Active, Inactive, Unknown)
 */
const _getDetectorState = (activeDetectorsRemote, detectorName) => {
  return activeDetectorsRemote.match({
    NotAsked: () => DetectorState.UNDEFINED,
    Loading: () => DetectorState.UNDEFINED,
    Failure: () => DetectorState.ERROR,
    Success: (activeDetectors) =>
      activeDetectors.includes(detectorName) ? DetectorState.ACTIVE : DetectorState.UNDEFINED
  })
}