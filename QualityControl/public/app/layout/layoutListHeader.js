import {h} from '/js/src/index.js';

export default function layoutListHeader(model) {
  return [
    h('.w-100.text-center', [
      h('div', {class: 'header-layout'}, [
        h('b', 'Layouts'),
        h('br'),
        h('span', model.layout.searchResult ? `${model.layout.searchResult.length} found of ${model.layout.list.length}` : `${model.layout.list.length} items`)
      ])
    ]),
    h('.w-100.text-right', [
      h('input.form-control.mh1.w-33', {placeholder: 'Search', type: 'search', value: model.layout.searchInput, oninput: e => model.layout.search(e.target.value)})
    ]),
  ];
}
