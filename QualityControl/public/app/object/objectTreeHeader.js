import {h} from '/js/src/index.js';
import {iconProject} from '/js/src/icons.js';

export default function objectTreeHeader(model) {
  if (!model.object.list) {
    return null;
  }

  const howMany = model.object.searchResult ? `${model.object.searchResult.length} found of ${model.object.list.length}` : `${model.object.list.length} items`;

  return [
    h('.w-50.text-center', [
      h('b.f4', 'Objects'),
      ' ',
      h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', [
      h('button.btn', {onclick: e => model.object.tree.toggleAll(), disabled: !!model.object.searchInput}, iconProject()),
      h('input.form-control.form-inline.mh1.w-33', {placeholder: 'Search', type: 'search', value: model.object.searchInput, oninput: (e) => model.object.search(e.target.value)})
    ]),
  ];
}
