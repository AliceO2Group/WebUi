/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

import {h} from '/js/src/index.js';
import objectTreeSidebar from '../object/objectTreeSidebar.js';
import objectPropertiesSidebar from '../object/objectPropertiesSidebar.js';
import {
  iconLayers, iconPlus, iconBarChart, iconExcerpt, iconMediaSkipBackward, iconMediaSkipForward, iconReload
} from '/js/src/icons.js';

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
      h('.sidebar-content', [objectTreeSidebar(model)])
    ]);
  }

  // General case with an optional menu on the left
  return h('nav.sidebar.sidebar-content.scroll-y.flex-column', {class: model.sidebar ? '' : 'sidebar-minimal'}, [
    sidebarMenu(model)
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
  model.isOnlineModeEnabled ? refreshOptions(model) : h('.menu-title', {style: 'flex-grow:1'}, ''),
  statusMenu(model),
  collapseSidebarMenuItem(model)
];

/**
 * Shows links to common pages (available layouts and objects tree)
 * @param {Object} model
 * @return {vnode}
 */
const exploreMenu = (model) => [
  h('.menu-title', model.sidebar ? 'Explore' : ''),
  h('a.menu-item', {
    title: 'Layouts',
    style: 'display:flex',
    href: '?page=layoutList',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'layoutList' ? 'selected' : ''
  }, [
    h('span', iconLayers()), model.sidebar && itemMenuText('Layouts')
  ]),
  h('a.menu-item', {
    title: 'Objects',
    style: 'display:flex',
    href: '?page=objectTree',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'objectTree' ? 'selected' : ''
  }, [
    h('span', iconBarChart()), model.sidebar && itemMenuText('Objects')
  ]),
];

/**
 * Shows links to layouts of user and link to create a new one
 * @param {Object} model
 * @return {vnode}
 */
const myLayoutsMenu = (model) => [
  h('.menu-title.flex-row', model.sidebar ? [
    h('', {style: 'width: 90%'}, 'My Layouts'),
    h('.ph2.text-right.actionable-icon', {
      title: 'Create a new layout',
      onclick: () => model.layout.newItem(prompt('Choose a name for the new layout:'))
    }, iconPlus())
  ] : ''),
  model.layout.myList.match({
    NotAsked: () => null,
    Loading: () => h('.menu-item', 'Loading...'),
    Success: (list) => h('.scroll-y', {
      style: 'min-height: 10em;'
    }, list.map((layout) => myLayoutsMenuItem(model, layout))),
    Failure: (error) => h('.menu-item', error),
  }),
];

/**
 * Show link to status page
 * @param {Object} model
 * @return {vnode}
 */
const statusMenu = (model) =>
  h('a.menu-item', {
    style: 'display: flex',
    title: 'About',
    href: '?page=about',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'about' ? 'selected' : ''
  }, [
    h('span', iconExcerpt()), model.sidebar && itemMenuText('About')
  ]);

/**
 * Shows one link to a layout
 * @param {Object} model
 * @param {Object} layout
 * @return {vnode}
 */
const myLayoutsMenuItem = (model, layout) => h('a.menu-item.w-wrapped', {
  title: layout.name,
  href: `?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}`,
  onclick: (e) => model.router.handleLinkEvent(e),
  class: model.router.params.layoutId === layout.id ? 'selected' : ''
}, [
  h('span', iconLayers()), model.sidebar && itemMenuText(layout.name)
]);

/**
 * Shows a little form to set interval of refresh of objects,
 * `refreshInterval` is id of a timer, when changed this "highlight" the form to
 * inform user objects have been loaded
 * @param {Object} model
 * @return {vnode}
 */
const refreshOptions = (model) => [
  h('', {
    class: model.sidebar ? 'menu-title' : '',
    style: 'flex-grow:1; height:auto'
  }, [
    model.sidebar &&
    [
      h('span.highlight', {
        key: 'timer' + model.refreshTimer,
        title: 'timer' + model.refreshTimer
      }, `Refresh period (${model.refreshInterval} seconds)`),
      h('input.form-control.text-center', {
        type: 'range',
        step: 1,
        min: 2,
        max: 120,
        value: model.refreshInterval,
        oninput: (e) => model.setRefreshInterval(e.target.value)
      })
    ],
    h('button.btn.btn-success', {
      type: 'button',
      class: model.sidebar ? 'w-100' : '',
      style: !model.sidebar ? 'margin: 0.25em' : '',
      title: 'Refresh objects now',
      onclick: () => model.setRefreshInterval(model.refreshInterval)
    }, model.sidebar ? 'Refresh objects now' : h('span', iconReload())),
  ]),
];

/**
* Show link to status page
* @param {Object} model
* @return {vnode}
*/
const collapseSidebarMenuItem = (model) =>
  h('a.menu-item', {
    title: 'Toggle Sidebar',
    onclick: () => model.toggleSidebar(),
  }, model.sidebar ?
    [iconMediaSkipBackward(), itemMenuText('Collapse Sidebar')]
    : iconMediaSkipForward(),
  );

/**
* Display text with item properties
* @param {string} text
* @return {vnode}
*/
const itemMenuText = (text) => h('span.ph2', text);
