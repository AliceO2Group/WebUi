import {h} from '/js/src/index.js';
import {iconLockLocked, iconLockUnlocked} from '/js/src/icons.js';

// The view
export default function view(model) {
  return h('.fill-parent.flex-column.items-center.justify-center',
    model.locked ? iconLockLocked() : iconLockUnlocked(),
    h('div', [
      h('button', {onclick: e => model.lock()}, 'Lock'),
      h('button', {onclick: e => model.unlock()}, 'Unlock')
    ])
  );
}
