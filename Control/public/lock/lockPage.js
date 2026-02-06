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

const LOCK_TABLE_HEADER_KEYS = ['Detector', 'Owner'];
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
    h('.text-center.scroll-y.absolute-fill', {style: 'top: 40px'}, [
      padlockState.match({
        NotAsked: () => null,
        Loading: () => loading(3),
        Failure: (error) => errorPage(error),
        Success: (detectorsLocksState) => h('.flex-column', [
          detectorsService.isGlobalView() && [
            h('.flex-row.g2.p2', [
              isUserAllowedRole(ROLES.Admin) && [
                h('strong', 'Admin actions: '),
                detectorLockActionButton(lockModel, DETECTOR_ALL, {}, DetectorLockAction.RELEASE, true, 'Force Release ALL'),
                detectorLockActionButton(lockModel, DETECTOR_ALL, {}, DetectorLockAction.TAKE, true, 'Force Take ALL'),
              ],
              isUserAllowedRole(ROLES.Global) && [
                h('strong', 'Global actions: '),
                detectorLockActionButton(lockModel, DETECTOR_ALL, {}, DetectorLockAction.RELEASE, false, 'Release ALL*'),
                detectorLockActionButton(lockModel, DETECTOR_ALL, {}, DetectorLockAction.TAKE, false, 'Take ALL*'),
              ],
            ]),
            h('small.text-left.ph2',
              'Note: Release/Take all will only affect the detectors you have access to and detectors that are available.'
            ),
          ],
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
      if (detectorName.toLocaleUpperCase().includes(TST_DETECTOR_NAME)) {
        return [emptyRowSeparator(), detectorLockRow(lockModel, detectorName, detectorLocksState[detectorName])];
      } else {
        return detectorLockRow(lockModel, detectorName, detectorLocksState[detectorName])
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
          h('td.ph2.warning', {colspan: 3}, [
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
 * @return {vnode}
 */
const detectorLockRow = (lockModel, detector, lockState) => {
  const ownerName = lockState?.owner?.fullName || '-';
  return h('tr', {
    id: `detector-row-${detector}`,
  }, [
    h('td',
      h('.flex-row.g2.items-center.f5', [
        detectorLockButton(lockModel, detector, lockState),
        detector
      ])
    ),
    h('td', ownerName),
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
const emptyRowSeparator = () => h('tr', h('td', {colspan: 3}, h('hr')));
