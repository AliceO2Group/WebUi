import {h} from '/js/src/index.js';

import objectTreeSidebar from '../object/objectTreeSidebar.js';
import objectPropertiesSidebar from '../object/objectPropertiesSidebar.js';
import {iconLayers, iconPlus, iconBarChart} from '/js/src/icons.js';

/**
 * Shows sidebar of application, can be object property editor in edit mode or a tree of objects
 * on edit mode or by default a navigation menu
 * @param {Object} model
 * @return {vnode}
 */
export default function sidebar(model) {
  // Spacial case when sidebar is used as a required form or perperty editor
  if (model.router.params.page === 'layoutShow' && model.layout.editEnabled && model.layout.editingTabObject) {
    return h('nav.sidebar.sidebar-extend', {class: ''}, [
      h('.sidebar-content.scroll-y', [
        objectPropertiesSidebar(model)
      ])
    ]);
  }

  // Spacial case when sidebar is used as a required form or perperty editor
  if (model.router.params.page === 'layoutShow' && model.layout.editEnabled) {
    return h('nav.sidebar.sidebar-extend', {class: ''}, [
      h('.sidebar-content', [
        objectTreeSidebar(model)
      ])
    ]);
  }

  // General case with an optional menu on the left
  return h('nav.sidebar', {class: model.sidebar ? '' : 'sidebar-closed'}, [
    h('.sidebar-content.scroll-y', [
      sidebarMenu(model)
    ])
  ]);
}

/**
 * Shows navigation menu of application with link to pages and a list of layouts owned by user session
 * @param {Object} model
 * @return {vnode}
 */
const sidebarMenu = (model) => [
  exploreMenu(model),
  myLayoutsMenu(model),
  refreshOptions(model),
];

/**
 * Shows links to common pages (available layouts and objects tree)
 * @param {Object} model
 * @return {vnode}
 */
const exploreMenu = (model) => [
  h('.menu-title', 'Explore'),
  h('a.menu-item', {
    href: '?page=layoutList',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'layoutList' ? 'selected' : ''
  },
  [
    iconLayers(), ' ', h('span', 'Layouts')
  ]),
  h('a.menu-item', {
    href: '?page=objectTree',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'objectTree' ? 'selected' : ''
  },
  [
    iconBarChart(), ' ', h('span', 'Objects')
  ]),
];

/**
 * Shows links to layouts of user and link to create a new one
 * @param {Object} model
 * @return {vnode}
 */
const myLayoutsMenu = (model) => [
  h('.menu-title', 'My Layouts'),
  model.layout.myList.match({
    NotAsked: () => null,
    Loading: () => h('.menu-item', 'Loading...'),
    Success: (list) => list.map((layout) => myLayoutsMenuItem(model, layout)),
    Failure: (error) => h('.menu-item', error),
  }),
  h('a.menu-item', {onclick: () => model.layout.newItem(prompt('Choose a name of the new layout:'))}, [
    iconPlus(), ' ', h('span', 'New layout...')
  ])
];

/**
 * Shows one link to a layout
 * @param {Object} model
 * @param {Object} layout
 * @return {vnode}
 */
const myLayoutsMenuItem = (model, layout) => h('a.menu-item.w-wrapped', {
  href: `?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}`,
  onclick: (e) => model.router.handleLinkEvent(e),
  class: model.router.params.layoutId === layout.id ? 'selected' : ''
},
[
  iconLayers(), ' ', h('span', layout.name)
]);

/**
 * Shows a little form to set interval of refresh of objects,
 * `refreshInterval` is id of a timer, when changed this "highlight" the form to
 * inform user objects have been loaded
 * @param {Object} model
 * @return {vnode}
 */
const refreshOptions = (model) => [
  h('.menu-title', {
    style: model.object.isOnlineModeEnabled ?'' : 'visibility: hidden'
  }, [
    h('span.highlight', {
      key: 'timer' + model.object.refreshTimer,
      title: 'timer' + model.object.refreshTimer
    }, `Refresh period (${model.object.refreshInterval} seconds)`),
    h('input.form-control.text-center', {
      type: 'range',
      step: 1,
      min: 2,
      max: 120,
      value: model.object.refreshInterval,
      oninput: (e) => model.object.setRefreshInterval(e.target.value)
    }),
    h('button.btn.w-100.btn-primary', {
      type: 'button',
      onclick: () => model.object.setRefreshInterval(model.object.refreshInterval)
    }, 'Refresh objects now'),
  ]),
];

