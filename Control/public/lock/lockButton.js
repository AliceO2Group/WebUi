import {h} from '/js/src/index.js';
import {iconLockLocked, iconLockUnlocked} from '/js/src/icons.js';
import switchCase from '../common/switchCase.js';

export default (model) => [
  model.lock.padlockState.match({
    NotAsked: () => buttonLoading(),
    Loading: () => buttonLoading(),
    Success: (data) => button(model, data),
    Failure: (error) => null,
  })
];

const button = (model, padlockState) => typeof padlockState.lockedBy !== 'number'
  ? h('button.btn', {
    title: 'Lock is free',
    onclick: () => model.lock.lock()
  }, iconLockUnlocked())
  : h('button.btn', {
    title: `Lock is talken by ${padlockState.lockedByName} (id ${padlockState.lockedBy})`,
    onclick: () => model.lock.unlock()
  }, iconLockLocked());

const buttonLoading = () => h('button.btn', {className: 'loading', disabled: true}, iconLockLocked());