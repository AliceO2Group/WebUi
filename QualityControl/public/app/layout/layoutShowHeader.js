import {h} from '/js/src/index.js';

export default function layoutShowHeader(model) {
  return [
    h('.w-100.text-center', [
      h('div', {class: 'header-layout'}, [
        h('b', model.layout.item.name),
        h('.f6.no-select',
          model.layout.item.folders.map((folder, i) => {
            const linkClass = model.layout.tab.name === folder.name ? 'active' : '';
            const onclick = () => model.layout.selectTab(i);

            return [
              h('button.br-pill.ph2.pointer.button.btn-xs.default', {class: linkClass, onclick}, folder.name),
              ' '
            ];
          })
        ),
        // h('br'),
        // h('span', model.layout.tab.name)
      ])
    ]),
    h('.w-100.text-right', [
      h('button.button.default.mh1',
        h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'},
          h('path', {d: 'M4 0l-1 3h-3l2.5 2-1 3 2.5-2 2.5 2-1-3 2.5-2h-3l-1-3z'})
        )
      ),
      h('.button-group.mh1',
        [
          h('button.button.default', {onclick: e => model.layout.editToggle()},
            [
              h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'},
                h('path', {d: 'M6 0l-1 1 2 2 1-1-2-2zm-2 2l-4 4v2h2l4-4-2-2z'})
              )
            ]
          ),
        ]
      )
    ]),
  ];
}
