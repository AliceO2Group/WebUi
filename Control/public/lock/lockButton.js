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
  }, iconLockLocked());

/**
 * Simple loading button
 * @return {vnode}
 */
const buttonLoading = () => h('button.btn', {className: 'loading', disabled: true}, iconLockLocked());
