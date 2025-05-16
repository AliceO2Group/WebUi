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

import { h } from '/js/src/index.js';
import LayoutUtils from './../LayoutUtils.js';
import {
  iconPencil, iconTrash, iconPlus, iconBadge, iconLayers, iconCheck, iconBan, iconShareBoxed,
} from '/js/src/icons.js';

/**
 * Shows header of page showing one layout with edit button, and other buttons in edit mode. (center and right)
 * @param {Layout} layout - the model that handles the object state.
 * @returns {vnode} - virtual node element
 */
export default (layout) => layout.item
  ? layout.editEnabled ? toolbarEditMode(layout) : toolbarViewMode(layout)
  : null;

/**
 * This is the toolbar in view mode (center and right)
 * @param {Layout} layout - the model that handles the object state.
 * @returns {vnode} - virtual node element
 */
const toolbarViewMode = (layout) => {
  const layoutItem = layout.item;
  const { isOfficial, owner_id, name } = layoutItem;

  return [
    h(
      '.w-50.text-center',
      h('div.header-layout', [layoutItem.tabs.map((tab, i) => toolbarViewModeTab(layout, tab, i))]),
    ),
    h('.flex-grow.text-right', [
      h('b.f4.items-center', [
        isOfficial ? iconBadge() : '',
        layoutItem.name,
      ]),
      ' ',
      // Show group button edit/duplicate only for owner of the layout shown
      h('.btn-group', [
        h('button.btn.btn-default', {
          onclick: () => {
            const nameForNewLayout = prompt('Choose a name for the new layout:').trim();
            layout.duplicate(nameForNewLayout);
          },
          title: 'Duplicate layout',
        }, iconLayers()),
        h('a.btn.btn-default', {
          title: 'Export layout skeleton as JSON file',
          href: `data:application/octet;,${encodeURIComponent(LayoutUtils.toSkeleton(layoutItem))}`,
          download: `layout-${name}-skeleton.json`,
        }, iconShareBoxed()),
        layout.ownsLayout(owner_id) && [
          h('.dropdown', {
            title: 'Edit layout',
            class: layout.isEditLayoutDropdownOpen ? 'dropdown-open' : '',
          }, [
            h('button.btn.btn-primary', { onclick: () => layout.toggleEditMenu() }, iconPencil()),
            h('.dropdown-menu.right-menu', [
              h('.text-ellipsis', [
                h('a.menu-item', { title: 'Edit via GUI', onclick: () => layout.edit() }, 'Edit via GUI'),
                h('a.menu-item', {
                  title: 'Edit via JSON',
                  onclick: () => layout.initializeEditViaJson(),
                }, 'Edit via JSON'),
              ]),
            ]),
          ]),
          h('button.btn.btn-danger', {
            onclick: () => confirm('Are you sure to delete this layout?') && layout.deleteItem(),
            title: 'Delete layout',
          }, iconTrash()),
        ],
      ]),
    ]),
  ];
};

/**
 * Single tab button in view mode to change tab of current layout
 * @param {Layout} layout - the model that handles the object state.
 * @param {object} tab - tab dto representation
 * @param {object} i - index of tab in the model array of tabs
 * @returns {vnode} - virtual node element
 */
const toolbarViewModeTab = (layout, tab, i) => {
  const linkClass = layout.tab.name === tab.name ? 'selected' : '';

  /**
   * Handler when user click on a tab to select it
   * @returns {undefined}
   */
  const selectTab = () => layout.selectTab(i);

  return [
    h('button.br-pill.ph2.btn.btn-tab', { class: linkClass, onclick: selectTab }, tab.name),
    ' ',
  ];
};

/**
 * Toolbar in edit mode (center and right) with rename, trash, save buttons
 * @param {Layout} layout - the model that handles the object state.
 * @returns {vnode} - virtual node element
 */
const toolbarEditMode = (layout) => [
  h('.w-50.text-center', [
    h('div', { class: 'header-layout' }, [
      h('span', layout.item.tabs.map((tab, i) => toolbarEditModeTab(layout, tab, i))),
      h('.btn-group', [
        tabBtn({
          title: 'Add new tab to this layout',
          class: 'default',
          onclick: () => {
            const name = prompt('Enter the name of the new tab:');
            if (name) {
              layout.newTab(name);
            }
          },
        }, iconPlus()),
      ]),
    ]),
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline', {
      type: 'text',
      value: layout.item.name,
      oninput: (e) => {
        layout.item.name = e.target.value.trim();
      },
    }),
    h('.btn-group.m1', [
      h('button.btn.btn-primary', {
        onclick: () => layout.save(),
        title: 'Save layout',
      }, iconCheck()),
      h('button.btn', {
        onclick: () => layout.cancelEdit(),
        title: 'Cancel',
      }, iconBan()),
    ]),
  ]),
];

/**
 * Single tab button in edit mode (with rename and trash buttons when selected)
 * @param {Layout} layout - the model that handles the object state.
 * @param {object} tab - tab dto representation
 * @param {object} i - index of tab in array of model
 * @returns {vnode} - virtual node element
 */
const toolbarEditModeTab = (layout, tab, i) => {
  const selected = layout.tab.name === tab.name;
  const linkClass = selected ? 'selected' : '';

  /**
   * Handler when user click on a tab to select it
   * @returns {undefined}
   */
  const selectTab = () => layout.selectTab(i);

  /**
   * Handler when user click on rename icon
   * @returns {undefined}
   */
  const renameTab = () => {
    const newName = prompt('Enter a new name for this tab:', tab.name);
    if (newName) {
      layout.renameTab(i, newName);
    }
  };

  return [
    h('.btn-group', [
      h('button.br-pill.ph2.btn.btn-tab', { class: linkClass, onclick: selectTab }, tab.name),
      selected && [
        h('button.br-pill.ph2.btn.btn-tab', {
          class: linkClass,
          onclick: renameTab,
          title: 'Rename tab',
        }, iconPencil()),
        resizeGridTabDropDown(layout, tab),
        h('button.br-pill.ph2.btn.btn-tab', {
          class: linkClass,
          onclick: () => layout.deleteTab(i),
          title: 'Delete tab',
        }, iconTrash()),
      ],
    ]),
    ' ',
  ];
};

/**
 * Dropdown for resizing the tab of a layout
 * @param {Layout} layout - the model that handles the object state.
 * @param {object} tab - tab dto representation
 * @returns {vnode} - virtual node element
 */
const resizeGridTabDropDown = (layout, tab) =>
  h('select.form-control.select-tab', {
    style: 'cursor: pointer',
    title: 'Resize grid of the tab',
    onchange: (e) => layout.resizeGridByXY(e.target.value),
  }, [1, 2, 3, 4, 5].map((i) =>
    h('option', { selected: tab?.columns === i, title: `Resize layout to ${i} columns`, value: 1 }, `${i} cols`)));

/**
 * Single tab button
 * @param {object} args - arguments to be passed to button
 * @returns {vnode} - virtual node element
 */
const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);
