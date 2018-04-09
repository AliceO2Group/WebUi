import {h} from '/js/src/index.js';

import objectTreeSidebar from './object/objectTreeSidebar.js';
import objectPropertiesSidebar from './object/objectPropertiesSidebar.js';
import {iconLayers, iconPlus, iconBarChart} from './icons.js';

export default function sidebar(model) {
  // Spacial case when sidebar is used as a required form or perperty editor
  if (model.router.parameter('page') === 'layoutShow' && model.layout.editEnabled && model.layout.editingTabObject) {
    return h('.sidebar.sidebar-extend', {class: ''}, [
      h('.sidebar-content', [
        objectPropertiesSidebar(model)
      ])
    ]);
  }

  // Spacial case when sidebar is used as a required form or perperty editor
  if (model.router.parameter('page') === 'layoutShow' && model.layout.editEnabled) {
    return h('.sidebar.sidebar-extend', {class: ''}, [
      h('.sidebar-content', [
        objectTreeSidebar(model)
      ])
    ]);
  }

  // General case with an optional menu on the left
  return h('.sidebar', {class: model.sidebar ? '' : 'sidebar-closed'}, [
    h('.sidebar-content', [
      sidebarMenu(model)
    ])
  ]);
}

const sidebarMenu = (model) => [
  exploreMenu(model),
  myLayoutsMenu(model),
  myFavoritesMenu(model),
  refreshOptions(model),
];

const exploreMenu = (model) => [
  h('.sidebar-menu-title', 'Explore'),
  h('a.sidebar-menu-item', {href: '?page=layoutList', onclick: (e) => model.router.handleLinkEvent(e), class: model.page === 'layoutList' ? 'active' : ''},
    [
      iconLayers(), ' ', h('span', 'Layouts')
    ]
  ),
  h('a.sidebar-menu-item', {href: '?page=objectTree', onclick: (e) => model.router.handleLinkEvent(e), class: model.page === 'objectTree' ? 'active' : ''},
    [
      iconBarChart(), ' ', h('span', 'Objects')
    ]
  ),
];

const myLayoutsMenu = (model) => [
  h('.sidebar-menu-title', 'My Layouts'),
  (model.layout.myList ? model.layout.myList.map((layout) => h('a.sidebar-menu-item', {
      href: `?page=layoutShow&layout=${encodeURIComponent(layout.name)}`,
      onclick: (e) => model.router.handleLinkEvent(e),
      class: model.router.parameter('layout') === layout.name ? 'active' : ''
    },
    [
      iconLayers(), ' ', h('span', layout.name)
    ]
  )) : null),
  h('a.sidebar-menu-item', {onclick: () => model.layout.newItem(prompt('Choose a name of the new layout:'))}, [
    iconPlus(), ' ', h('span', 'New layout...')
  ])
];

const myFavoritesMenu = (model) => [
// TODO
// h('.sidebar-menu-title',
//   'My Favorites'
// ),
// h('a.sidebar-menu-item',
//   [
//     iconLayers(), ' ', h('span', 'Alice P2')
//   ]
// ),
// h('a.sidebar-menu-item', {href: '/a/objects/DAQ01-EquipmentSize-ACORDE-ACORDE', onclick: e => model.router.link(e), class: model.route === 'objeddcts' ? 'active' : ''},
//   [
//     iconPlus(), ' ', h('span', 'DAQ 866')
//   ]
// )
];

const refreshOptions = (model) => [
  h('.sidebar-menu-title',[
    h('span', [
      h('span.highlight', {key: 'timer' + model.object.refreshTimer, title: 'timer' + model.object.refreshTimer}, 'Refresh period')
    ]),
    ' ',
    h('input.form-control.text-center', {
      type: 'number',
      style: {'width': '50px'},
      value: model.object.refreshInterval,
      oninput: (e) => model.object.setRefreshInterval(e.target.value)
    }),
    ' ',
    h('button.button', {onclick: () => model.object.setRefreshInterval(model.object.refreshInterval)}, 'Now')
  ]),
];

