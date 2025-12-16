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
import { filterPanelToggleButton } from '../../common/filters/filterViews.js';

/**
 * Shows header of page showing one layout with edit button, and other buttons in edit mode. (center and right)
 * @param {Layout} layout - the model that handles the object state.
 * @param {FilterModel} filterModel - The model handeling the filter state
 * @returns {vnode} - virtual node element
 */
export default (layout, filterModel) => {
  const { item, editEnabled = false } = layout;
  if (item) {
    return editEnabled ? toolbarEditMode(layout) : toolbarViewMode(layout, filterModel);
  }
  return;
};

/**
 * This is the toolbar in view mode (center and right)
 * @param {Layout} layout - the model that handles the object state
 * @param {FilterModel} filterModel - The model handeling the filter state
 * @returns {vnode} - virtual node element
 */
const toolbarViewMode = (layout, filterModel) => {
  const layoutItem = layout.item;
  const { isOfficial, owner_id, name } = layoutItem;

  return {
    centerCol: h('b.f4.items-center.flex-grow.text-center', [isOfficial ? iconBadge() : '', layoutItem.name]),
    rightCol: h('.w-25.text-right.g2.flex-row.justify-end.flex-wrap', [
      ' ',
      filterPanelToggleButton(filterModel),
      h('.btn-group.flex-wrap', [
        ' ',
        newLayoutButton(layout),
        jsonExportButton(layoutItem, name),
        layout.ownsLayout(owner_id) && [editDropdown(layout), deleteButton(layout)],
      ]),
    ]),
    subRow: h(
      '.flex-grow.text-center',
      [h('.header-layout.header-layout-tabs', [tabViewLinks(layoutItem, layout)])],
    ),
  };
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
    h('button.br-pill.ph2.btn.btn-tab.flex-fixed', { id: `tab-${i}`, class: linkClass, onclick: selectTab }, tab.name),
    ' ',
  ];
};

/**
 * Toolbar in edit mode (center and right) with rename, trash, save buttons
 * @param {Layout} layout - the model that handles the object state
 * @returns {vnode} - virtual node element
 */
const toolbarEditMode = (layout) => {
  const inputHandler = (e) => {
    layout.item.name = e.target.value.trim();
  };

  return {
    subRow: h('.flex-grow.text-center', [
      h('.header-layout.edit', [
        h('span.header-layout-tabs', editTabLinks(layout)),
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
    rightCol: h('.w-25.text-right.flex-row.justify-end', [
      h('input.form-control.form-inline', {
        type: 'text',
        value: layout.item.name,
        oninput: inputHandler,
      }),
      h('.btn-group.m1', [
        saveButton(layout),
        cancelButton(layout),
      ]),
    ]),
  };
};

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

  const dropZoneClass = (position) => layout.dropTargetId === tab.id && layout.position === position ? 'active' : ''

  return [
    h(
      '.btn-group.flex-fixed.relative',
      {
        draggable: true,
        ondragstart: (e) => e.dataTransfer.setData('text/plain', tab.id),
        ondrop: (e) => {
          layout.reorderTabs(e.dataTransfer.getData('text/plain'), layout.dropTargetId, layout.position);
          layout.clearDropTarget();
        }
      },
      [
        h('button.br-pill.ph2.btn.btn-tab.whitespace-nowrap', { class: linkClass, onclick: selectTab }, tab.name),
        [
          h(
            '.drop-zone.before',
            {
              class: dropZoneClass('before'),
              ondragenter: () => layout.setDropTarget(tab.id, 'before'),
              ondragover: (e) => e.preventDefault(), // prevent default to allow drop
              ondragleave: () => {
                if (layout.dropTargetId === tab.id && layout.position === 'before') {
                  layout.clearDropTarget();
                }
              }
            },
            ''
          ),
          h(
            '.drop-zone.after',
            {
              class: dropZoneClass('after'),
              ondragenter: () => layout.setDropTarget(tab.id, 'after'),
              ondragover: (e) => e.preventDefault(), // prevent default to allow drop
              ondragleave: () => {
                if (layout.dropTargetId === tab.id && layout.position === 'after') {
                  layout.clearDropTarget();
                }
              }
            },
            ''
          ),
          selected && [
            editTabButton(layout, linkClass, tab, i),
            resizeGridTabDropDown(layout, tab),
            deleteTabButton(layout, linkClass, i),
          ],
        ].flat().filter(Boolean)
      ]
    ),
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
  h('select.form-control.select-tab.cursor-pointer', {
    title: 'Resize grid of the tab',
    onchange: (e) => layout.resizeGridByXY(e.target.value),
  }, [1, 2, 3, 4, 5].map((i) =>
    h('option', { selected: tab?.columns === i, title: `Resize layout to ${i} columns`, value: i }, `${i} cols`)));

/**
 * Single tab button
 * @param {object} args - arguments to be passed to button
 * @returns {vnode} - virtual node element
 */
const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);

/**
 * Dropdown menu for layout editing options
 * @param {Layout} layout - the model that handles the object state
 * @returns {vnode} - virtual node element
 */
const editDropdown = (layout) =>
  h('.dropdown', {
    title: 'Edit layout',
    class: layout.isEditLayoutDropdownOpen ? 'dropdown-open' : '',
  }, [
    h('button.btn.btn-primary', { onclick: () => layout.toggleEditMenu() }, iconPencil()),
    h('.dropdown-menu.right-menu', [
      h('.text-ellipsis', [
        h('a.menu-item', { id: 'editByGui', title: 'Edit via GUI', onclick: () => layout.edit() }, 'Edit via GUI'),
        h('a.menu-item', {
          id: 'editByJson',
          title: 'Edit via JSON',
          onclick: () => layout.initializeEditViaJson(),
        }, 'Edit via JSON'),
      ]),
    ]),
  ]);

/**
 * Button to export layout as JSON file
 * @param {object} layoutItem - layout data object
 * @param {string} name - name of the layout
 * @returns {vnode} - virtual node element
 */
const jsonExportButton = (layoutItem, name) =>
  h('a.btn.btn-default', {
    title: 'Export layout skeleton as JSON file',
    href: `data:application/octet;,${encodeURIComponent(LayoutUtils.toSkeleton(layoutItem))}`,
    download: `layout-${name}-skeleton.json`,
  }, iconShareBoxed());

/**
 * Button to create a new layout by duplicating current one
 * @param {Layout} layout - the model that handles the object state
 * @returns {vnode} - virtual node element
 */
const newLayoutButton = (layout) =>
  h('button.btn.btn-default', {
    onclick: () => {
      const nameForNewLayout = prompt('Choose a name for the new layout:').trim();
      layout.duplicate(nameForNewLayout);
    },
    title: 'Duplicate layout',
  }, iconLayers());

/**
 * Button to delete current layout
 * @param {Layout} layout - the model that handles the object state
 * @returns {vnode} - virtual node element
 */
const deleteButton = (layout) =>
  h('button.btn.btn-danger', {
    onclick: () => confirm('Are you sure to delete this layout?') && layout.deleteItem(),
    title: 'Delete layout',
  }, iconTrash());

/**
 * Button component for saving layout changes
 * @param {Layout} layout - the model that handles the object state
 * @returns {vnode} - virtual node element representing the save button
 */
const saveButton = (layout) =>
  h('button.btn.btn-primary', {
    key: 'save-button',
    onclick: () => layout.save(),
    title: 'Save layout',
  }, iconCheck());

/**
 * Button component for canceling edit mode
 * @param {Layout} layout - the model that handles the object state
 * @returns {vnode} - virtual node element representing the cancel button
 */
const cancelButton = (layout) =>
  h('button.btn', {
    id: 'cancel-button',
    onclick: () => layout.cancelEdit(),
    title: 'Cancel',
  }, iconBan());

/**
 * Button component for editing a tab (rename)
 * @param {Layout} layout - the model that handles the object state
 * @param {string} linkClass - CSS class for the button
 * @param {object} tab - tab dto representation
 * @param {number} i - index of the tab in the layout
 * @returns {vnode} - virtual node element representing the edit tab button
 */
const editTabButton = (layout, linkClass, tab, i) =>
  h('button.br-pill.ph2.btn.btn-tab', {
    class: linkClass,
    onclick: () => {
      const newName = prompt('Enter a new name for this tab:', tab.name);
      if (newName) {
        layout.renameTab(i, newName);
      }
    },
    title: 'Rename tab',
  }, iconPencil());

/**
 * Button component for deleting a tab
 * @param {Layout} layout - the model that handles the object state
 * @param {string} linkClass - CSS class for the button
 * @param {number} i - index of the tab to delete
 * @returns {vnode} - virtual node element representing the delete tab button
 */
const deleteTabButton = (layout, linkClass, i) =>
  h('button.br-pill.ph2.btn.btn-tab', {
    class: linkClass,
    onclick: () => layout.deleteTab(i),
    title: 'Delete tab',
  }, iconTrash());

/**
 * Generates virtual nodes for editing tabs in the layout toolbar
 * @param {Layout} layout - the model that handles the object state
 * @returns {Array<vnode>} - array of virtual node elements representing editable tabs
 */
const editTabLinks = (layout) =>
  layout.item.tabs.map((tab, i) => toolbarEditModeTab(layout, tab, i));

/**
 * Generates virtual nodes for viewing tabs in the layout toolbar
 * @param {object} layoutItem - layout data object
 * @param {Layout} layout - the model that handles the object state
 * @returns {Array<vnode>} - array of virtual node elements representing viewable tabs
 */
const tabViewLinks = (layoutItem, layout) =>
  layoutItem.tabs.map((tab, i) => toolbarViewModeTab(layout, tab, i));
