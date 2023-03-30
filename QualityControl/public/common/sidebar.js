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

/* global QCG */

import { h } from '/js/src/index.js';
import layoutSettings from './../layout/view/panels/settings.js';
import objectPropertiesSidebar from '../object/objectPropertiesSidebar.js';
import {
  iconLayers, iconPlus, iconBarChart, iconExcerpt, iconMediaSkipBackward, iconMediaSkipForward, iconReload,
  iconCloudUpload,
} from '/js/src/icons.js';

/**
 * Shows sidebar of application, can be object property editor in edit mode or a tree of objects
 * on edit mode or by default a navigation menu
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
export default function sidebar(model) {
  // Special case when sidebar is used as a required form or property editor
  if (model.router.params.page === 'layoutShow' && model.layout.editEnabled && model.layout.editingTabObject) {
    return h('nav.sidebar.sidebar-extend', [h('.sidebar-content.scroll-y', [objectPropertiesSidebar(model)])]);
  }

  // Spacial case when sidebar is used as a required form or property editor
  if (model.router.params.page === 'layoutShow' && model.layout.editEnabled) {
    return h('nav.sidebar.sidebar-extend', [h('.sidebar-content', layoutSettings(model))]);
  }

  // General case with an optional menu on the left
  return h('nav.sidebar.sidebar-content.scroll-y.flex-column', {
    class: model.sidebar ? '' : 'sidebar-minimal',
  }, [sidebarMenu(model)]);
}

/**
 * Shows navigation menu of application with link to pages and a list of layouts owned by user session
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
const sidebarMenu = (model) => [
  exploreMenu(model),
  myLayoutsMenu(model),
  model.isOnlineModeEnabled ? refreshOptions(model) : h('.menu-title', { style: 'flex-grow:1' }, ''),
  statusMenu(model),
  collapseSidebarMenuItem(model),
];

/**
 * Shows links to common pages (available layouts and objects tree)
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
const exploreMenu = (model) => [
  h('.menu-title', model.sidebar ? 'Explore' : ''),
  h('a.menu-item', {
    title: 'Layouts',
    style: 'display:flex',
    href: '?page=layoutList',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'layoutList' ? 'selected' : '',
  }, [h('span', iconLayers()), model.sidebar && itemMenuText('Layouts')]),
  h('a.menu-item', {
    title: 'Objects',
    style: 'display:flex',
    href: '?page=objectTree',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'objectTree' ? 'selected' : '',
  }, [h('span', iconBarChart()), model.sidebar && itemMenuText('Objects')]),
];

/**
 * Shows links to layouts of user and link to create a new one
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
const myLayoutsMenu = (model) => [
  h('.menu-title.flex-row', model.sidebar ? [
    h('', { style: 'width: 90%' }, 'My Layouts'),
    h('.ph2.text-right.actionable-icon', {
      title: 'Import a layout',
      onclick: () => {
        model.isImportVisible = true;
      },
    }, iconCloudUpload()),
    h('.ph2.text-right.actionable-icon', {
      title: 'Create a new layout',
      onclick: () => model.layout.newItem(prompt('Choose a name for the new layout:')),
    }, iconPlus()),
  ] : ''),
  model.services.layout.userList.match({
    NotAsked: () => null,
    Loading: () => h('.menu-item', 'Loading...'),
    Success: (list) => h('.scroll-y', {
      style: 'min-height: 10em;',
    }, list.map((layout) => myLayoutsMenuItem(model, layout))),
    Failure: () => null,
  }),
];

/**
 * Show link to status page
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
const statusMenu = (model) =>
  h('a.menu-item', {
    style: 'display: flex',
    title: 'About',
    href: '?page=about',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.page === 'about' ? 'selected' : '',
  }, [h('span', iconExcerpt()), model.sidebar && itemMenuText('About')]);

/**
 * Shows one link to a layout
 * @param {Model} model - root model of the application
 * @param {Object} layout - layout dto representation
 * @return {vnode} - virtual node element
 */
const myLayoutsMenuItem = (model, layout) => h('a.menu-item.w-wrapped', {
  title: layout.name,
  onclick: () => model.layout.setFilterToURL(layout.id, false),
  class: model.router.params.layoutId === layout.id ? 'selected' : '',
}, [h('span', iconLayers()), model.sidebar && itemMenuText(layout.name)]);

/**
 * Shows a little form to set interval of refresh of objects,
 * `refreshInterval` is id of a timer, when changed this "highlight" the form to
 * inform user objects have been loaded
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
const refreshOptions = (model) => [
  h('', {
    class: model.sidebar ? 'menu-title' : '',
    style: 'flex-grow:1; height:auto',
  }, [
    model.sidebar &&
    [
      h('span.highlight', {
        key: `timer${model.refreshTimer}`,
        title: `timer${model.refreshTimer}`,
      }, `Refresh period (${model.refreshInterval} seconds)`),
      h('input.form-control.text-center', {
        type: 'range',
        step: 1,
        min: QCG.REFRESH_MIN_INTERVAL,
        max: QCG.REFRESH_MAX_INTERVAL,
        value: model.refreshInterval,
        oninput: (e) => model.setRefreshInterval(e.target.value),
      }),
    ],
    h('button.btn.btn-success', {
      type: 'button',
      class: model.sidebar ? 'w-100' : '',
      style: !model.sidebar ? 'margin: 0.25em' : '',
      title: 'Refresh objects now',
      onclick: () => model.setRefreshInterval(model.refreshInterval),
    }, model.sidebar ? 'Refresh objects now' : h('span', iconReload())),
  ]),
];

/**
 * Show link to status page
 * @param {Model} model - root model of the application
 * @return {vnode} - virtual node element
 */
const collapseSidebarMenuItem = (model) =>
  h('a.menu-item', {
    title: 'Toggle Sidebar',
    onclick: () => model.toggleSidebar(),
  }, model.sidebar ?
    [iconMediaSkipBackward(), itemMenuText('Collapse Sidebar')]
    : iconMediaSkipForward());

/**
 * Display text with item properties
 * @param {string} text - string to be displayed
 * @return {vnode} - virtual node element
 */
const itemMenuText = (text) => h('span.ph2', text);
