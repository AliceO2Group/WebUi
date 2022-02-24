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

/**
 * View of lock button
 * See "button" for more details
 * @param {string} size Size 'small' or 'big'
 * @param {Object} model
 * @return {vnode}
 */
export const detectorLockButton = (model, name, size) => [
  model.lock.padlockState.match({
    NotAsked: () => buttonLoading(),
    Loading: () => buttonLoading(),
    Success: (data) => button(model, name, data, size),
    Failure: (_error) => null,
  })
];

/**
 * Shows lock or unlock icon depending of padlock state (taken or not)
 * Shows also name of owner and its ID on mouse over
 * @param {Object} model
 * @param {string} name name of the lock
 * @param {Object} padlockState
 * @param {string} look Class for the lock button
 * @return {vnode}
 */
const button = (model, name, padlockState, look) => padlockState.lockedBy && name in padlockState.lockedBy
  ? h(look == 'small' ? 'a.f6.button.flex-row.items-center.justify-center.actionable-icon' : 'button.btn', {
    title: `Lock is taken by ${padlockState.lockedByName[name]} (id ${padlockState.lockedBy[name]})`,
    style: look == 'small' && 'width: 20px',
    onclick: () => {
      model.lock.unlock(name);
      model.workflow.flpSelection.unselectDetector(name);
    }}, model.lock.isLockedByMe(name) ? iconLockLocked('fill-green') : iconLockLocked('fill-orange'))
  : h(look == 'small' ? 'a.f6.button.flex-row.items-center.justify-center.actionable-icon' : 'button.btn', {
    title: 'Lock is free',
    style: look == 'small' && 'width: 20px',
    onclick: () => model.lock.lock(name)
  }, iconLockUnlocked('fill-orange'));
/**
 * Simple loading button
 * @return {vnode}
 */
const buttonLoading = () => h('button.btn', {className: 'loading', disabled: true}, iconLockLocked());
