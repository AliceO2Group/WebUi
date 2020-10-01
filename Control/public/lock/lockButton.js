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
 * View of lock button, when taken, it shows who owns it
 * Otherwise show a loading button
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  model.lock.padlockState.match({
    NotAsked: () => buttonLoading(),
    Loading: () => buttonLoading(),
    Success: (data) => button(model, data),
    Failure: (_error) => null,
  })
];

/**
 * Shows lock or unlock icon depending of padlock state (taken or not)
 * Shows also name of owner and its ID on mouse over
 * @param {Object} model
 * @param {Object} padlockState
 * @return {vnode}
 */
const button = (model, padlockState) => typeof padlockState.lockedBy !== 'number'
  ? h('button.btn', {
    title: 'Lock is free',
    onclick: () => model.lock.lock()
  }, iconLockUnlocked())
  : h('button.btn', {
    title: `Lock is taken by ${padlockState.lockedByName} (id ${padlockState.lockedBy})`,
    onclick: () => model.lock.unlock()
  }, (model.session.personid == padlockState.lockedBy) ? iconLockLocked('fill-green') : iconLockLocked('fill-orange'));

/**
 * Simple loading button
 * @return {vnode}
 */
const buttonLoading = () => h('button.btn', {className: 'loading', disabled: true}, iconLockLocked());
