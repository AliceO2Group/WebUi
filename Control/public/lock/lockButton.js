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
export const detectorButton = (model, name) => [
  model.lock.padlockState.match({
    NotAsked: () => buttonLoading(),
    Loading: () => buttonLoading(),
    Success: (data) => button(model, name, data, 'a.button.w-10.flex-row.items-center.justify-center.actionable-icon.gray-darker'),
    Failure: (_error) => null,
  })
];

export const detectorButtonLarge = (model, name, disabled = false) => [
  model.lock.padlockState.match({
    NotAsked: () => buttonLoading(),
    Loading: () => buttonLoading(),
    Success: (data) =>  button(model, name, data, 'button.btn', disabled),
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
const buttonBtn = (model, name, padlockState) => padlockState.lockedBy && name in padlockState.lockedBy
  ? h('button.btn', {
    title: `Lock is taken by ${padlockState.lockedByName[name]} (id ${padlockState.lockedBy[name]})`,
    onclick: () => model.lock.unlock(name)
  }, model.lock.isLockedByMe(name) ? iconLockLocked('fill-green') : iconLockLocked('fill-orange'))
  : h('button.btn', {
    title: 'Lock is free',
    onclick: () => { model.lock.lock(name); model.workflows.FlpSelection.unselect(name); }
  }, iconLockUnlocked());

const button = (model, name, padlockState, look, disabled) => padlockState.lockedBy && name in padlockState.lockedBy
  ? h(look, {
    title: `Lock is taken by ${padlockState.lockedByName[name]} (id ${padlockState.lockedBy[name]})`,
    onclick: () => {
      model.lock.unlock(name);
      model.workflow.flpSelection.unselectDetector(name);
  }}, model.lock.isLockedByMe(name) ? iconLockLocked('fill-green') : iconLockLocked('fill-orange'))
  : h(look, {
    title: 'Lock is free'+disabled,
    onclick: () => model.lock.lock(name)
  }, iconLockUnlocked());
/**
 * Simple loading button
 * @return {vnode}
 */
const buttonLoading = () => h('button.btn', {className: 'loading', disabled: true}, iconLockLocked());
