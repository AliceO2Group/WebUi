import {h} from '/js/src/index.js';

import objectTreeSidebar from './object/objectTreeSidebar.js';

export default function sidebar(model) {
  const className = `${model.layout.editEnabled ? 'sidebar-extend' : ''}
                     ${!model.sidebar && !model.layout.editEnabled ? 'sidebar-closed' : ''}`;

  return h('.sidebar', {class: className},
    h(".sidebar-content",
      model.layout.editEnabled ? (model.layout.editingItem ? sidebarObjectProperties(model) : sidebarObjectTree(model)) : sidebarMenu(model)
    )
  );
}

function sidebarObjectProperties(model) {
  return h('.p2', [
    h('div', 'Plot size'),
    h('table', [
      h('tr', [
        h('td', [
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 1, 1)}, '1x1'), ' ',
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 2, 1)}, '2x1'), ' ',
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 3, 1)}, '3x1'), ' ',
        ])
      ]),
      h('tr', [
        h('td', [
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 1, 2)}, '1x2'), ' ',
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 2, 2)}, '2x2'), ' ',
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 3, 2)}, '3x2'), ' ',
        ])
      ]),
      h('tr', [
        h('td', [
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 1, 3)}, '1x3'), ' ',
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 2, 3)}, '2x3'), ' ',
          h('button.button.default.btn-xs', {onclick: () => model.layout.resizeItem(model.layout.editingItem, 3, 3)}, '3x3'), ' ',
        ])
      ]),
    ]),
    h('hr'),
    h('div', 'Plot options'),
    h('.flex-row', [
      h('button.button.default.flex-grow.m1', 'Linear'),
      ' ',
      h('button.button.default.flex-grow.m1', 'Log'),
    ]),
    h('hr'),
    h('.flex-row', [
      h('button.button.alert.flex-grow.m1', {onclick: () => model.layout.deleteItem(model.layout.editingItem)}, 'Delete'),
      ' ',
      h('button.button.primary.flex-grow.m1', {onclick: () => model.layout.editItem(null)}, 'Finish'),
    ]),
  ]);
}

function sidebarObjectTree(model) {
  return [
    objectTreeSidebar(model)
  ];
}

function sidebarMenu(model) {
  return [
    h(".sidebar-menu-title",
      "Explore"
    ),
    h("a.sidebar-menu-item", {href: '?page=layoutList', onclick: e => model.router.handleLinkEvent(e), class: model.page === 'layoutList' ? 'active' : ''},
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M0 0v4h4v-4h-4zm5 2v3h-3v1h4v-4h-1zm2 2v3h-3v1h4v-4h-1z'][id='layers']")
        ),
        ' ',
        h('span', "Layouts")
      ]
    ),
    h("a.sidebar-menu-item", {href: '?page=objectTree', onclick: e => model.router.handleLinkEvent(e), class: model.page === 'objectTree' ? 'active' : ''},
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'][id='bar-chart']")
        ),
        ' ',
        h('span', "Objects")
      ]
    ),
    h(".sidebar-menu-title",
      "My Layouts"
    ),
    h("a.sidebar-menu-item",
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M0 0v4h4v-4h-4zm5 2v3h-3v1h4v-4h-1zm2 2v3h-3v1h4v-4h-1z'][id='layers']")
        ),
        ' ',
        h('span', "Test")
      ]
    ),
    h("a.sidebar-menu-item",
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M0 0v4h4v-4h-4zm5 2v3h-3v1h4v-4h-1zm2 2v3h-3v1h4v-4h-1z'][id='layers']")
        ),
        ' ',
        "Test 2"
      ]
    ),
    h("a.sidebar-menu-item",
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M3 0v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z'][id='plus']")
        ),
        ' ',
        h('span', "New layout...")
      ]
    ),
    h(".sidebar-menu-title",
      "My Favorites"
    ),
    h("a.sidebar-menu-item",
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M0 0v4h4v-4h-4zm5 2v3h-3v1h4v-4h-1zm2 2v3h-3v1h4v-4h-1z'][id='layers']")
        ),
        ' ',
        h('span', "Alice P2")
      ]
    ),
    h("a.sidebar-menu-item", {href: '/a/objects/DAQ01-EquipmentSize-ACORDE-ACORDE', onclick: e => model.router.link(e), class: model.route === 'objeddcts' ? 'active' : ''},
      [
        h("svg.icon[fill='currentcolor'][viewBox='0 0 8 8']",
          h("path[d='M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'][id='bar-chart']")
        ),
        ' ',
        h('span', "DAQ 866")
      ]
    )
  ];
}
