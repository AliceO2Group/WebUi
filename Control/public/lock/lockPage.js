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
import {detectorLockButton} from './lockButton.js';
import {ROLES} from './../workflow/constants.js';

/**
 * @file Header of the Task Page that displays the title and 2 clean operations
 */

/**
 * Header
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
 * Content
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => [
  detectorHeader(model),
  h('.text-center.scroll-y.absolute-fill', {style: 'top: 40px'}, [
    detectorLocks(model, model.detectors.listRemote.payload)
  ])
];

/**
 * Table with lock status detetails, buttons to lock them, and admin actions such us "Force lock"
 * @param {Object} model
 * @param {Array} detectors List of detectors
 */
const detectorLocks = (model, detectors) =>
  h('table.table.table-sm', {style: 'white-space: pre-wrap; margin-bottom: 0'},
    h('thead',
      h('tr',
        ['Detector', 'Lock state', 'Running', 'Owner'].map(header => h('th.w-20', header)),
        model.isAllowed(ROLES.Admin) && h('th', 'Admin actions')
      )
    ),
    h('tbody', [detectors &&  detectors.map(detector =>
      ((model.isAllowed(ROLES.Global)
      && ((model.detectors.selected == 'GLOBAL') || model.detectors.selected == detector))
      || model.detectors.authed.includes(detector)) &&
      h('tr', {style: {background: model.lock.isLockedByMe(detector) ? 'rgba(76, 175, 80, 0.1)' : model.lock.isLocked(detector) ? 'rgba(239, 130, 57, 0.1)' : ''}}, [
        h('td', {style: 'font-weight: bold'}, detector),
        h('td', detectorLockButton(
          model, detector, !(model.isAllowed(ROLES.Global) || model.detectors.includes(detector))
        )),
        h('td', model.workflow.flpSelection.isDetectorActive(detector) ? 'Yes' : 'No'),
        h('td', model.lock.getOwner(detector) || '-'),
        model.isAllowed(ROLES.Admin)
        && h('td', model.lock.isLocked(detector)
        && h('button.danger', {onclick: () => model.lock.forceUnlock(detector)}, 'Force lock'))
      ])
    )])
  );
