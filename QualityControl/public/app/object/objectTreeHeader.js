import {h} from '/js/src/index.js';
import {iconProject} from '/js/src/icons.js';

export default function objectTreeHeader(model) {
  if (!model.object.list) {
    return null;
  }

  const howMany = model.object.searchInput ? `${model.object.searchResult.length} found of ${model.object.list.length}` : `${model.object.list.length} items`;

  return [
    h('.w-50.text-center', [
      h('b.f4', 'Objects'),
      ' ',
      h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', [
      h('button.btn', {title: 'Toggle online / offline mode', onclick: e => model.object.toggleMode(), class: (model.object.onlineMode ? 'active' : '')}, 'Online'),
      ' ',
      h('button.btn', {title: 'Open or close whole tree', onclick: e => model.object.tree.toggleAll(), disabled: !!model.object.searchInput}, iconProject()),
      ' ',
      h('input.form-control.form-inline.mh1.w-33', {placeholder: 'Search', type: 'text', value: model.object.searchInput, oninput: (e) => model.object.search(e.target.value)})
    ]),
  ];
}
