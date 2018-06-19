import {h} from '/js/src/index.js';
import {iconLockLocked, iconLockUnlocked} from '/js/src/icons.js';
import switchCase from '../common/switchCase.js';

export default (model) => [
  model.role.list.match({
    NotAsked: () => buttonLoading(),
    Loading: () => pageLoading(),
    Success: (data) => button(model),
    Failure: (error) => null,
  })
];

const button = (model) => typeof model.lock.padlockState.getPayload().lockedBy !== 'number'
  ? h('button.btn', {
    title: 'Lock is free',
    onclick: () => model.lock.lock()
  }, iconLockUnlocked())
  : h('button.btn', {
    title: `Lock is talken by ${model.lock.padlockState.getPayload().lockedByName} (id ${model.lock.padlockState.getPayload().lockedBy})`,
    onclick: () => model.lock.unlock()
  }, iconLockLocked());

const buttonLoading = () => h('button.btn', {className: 'loading', disabled: true}, iconLockLocked());