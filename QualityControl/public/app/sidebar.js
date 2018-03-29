import {h} from '/js/src/index.js';

import objectTreeSidebar from './object/objectTreeSidebar.js';
import objectPropertiesSidebar from './object/objectPropertiesSidebar.js';
import {iconLayers, iconPlus, iconBarChart} from './icons.js';

export default function sidebar(model) {
  const className = `${model.layout.editEnabled ? 'sidebar-extend' : ''}
                     ${!model.sidebar && !model.layout.editEnabled ? 'sidebar-closed' : ''}`;

  return h('.sidebar', {class: className},
    h('.sidebar-content',
      model.layout.editEnabled ? (model.layout.editingTabObject ? objectPropertiesSidebar(model) : objectTreeSidebar(model)) : sidebarMenu(model)
    )
  );
}

const sidebarMenu = (model) => [
  exploreMenu(model),
  myLayoutsMenu(model),
  myFavoritesMenu(model),
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

