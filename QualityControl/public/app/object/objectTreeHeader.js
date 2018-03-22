import {h} from '/js/src/index.js';

export default function objectTreeHeader(model) {
  return [
    h('.w-100.text-center', [
      h('div', {class: 'header-layout'}, [
        h('b', 'Objects'),
        h('br'),
        h('span', model.object.searchResult ? `${model.object.searchResult.length} found of ${model.object.list.length}` : `${model.object.list.length} items`)
      ])
    ]),
    h('.w-100.text-right', [
      h('button.button.default', {onclick: e => model.object.tree.toggleAll(), disabled: !!model.object.searchInput},
        [
          h('svg.icon[fill="currentcolor"][viewBox="0 0 8 8"]',
            h('path[d="M0 0v7h1v-7h-1zm7 0v7h1v-7h-1zm-5 1v1h2v-1h-2zm1 2v1h2v-1h-2zm1 2v1h2v-1h-2z"]')
          )
        ]
      ),
      h('input.form-control.mh1.w-33', {placeholder: 'Search', type: 'search', value: model.object.searchInput, oninput: (e) => model.object.search(e.target.value)})
    ]),
  ];
}
