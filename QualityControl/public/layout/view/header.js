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
import { iconPencil, iconTrash, iconPlus, iconLayers, iconCheck, iconBan, iconShareBoxed } from '/js/src/icons.js';

/**
 * Shows header of page showing one layout with edit button, and other buttons in edit mode. (center and right)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => model.layout.item
  ? model.layout.editEnabled ? toolbarEditMode(model) : toolbarViewMode(model)
  : null;

/**
 * This is the toolbar in view mode (center and right)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const toolbarViewMode = (model) => [
  h(
    '.w-50.text-center',
    h('div.header-layout', [model.layout.item.tabs.map((tab, i) => toolbarViewModeTab(model, tab, i))]),
  ),
  h('.flex-grow.text-right', [
    h('b.f4', model.layout.item.name),
    ' ',
    // Show group button edit/duplicate only for owner of the layout shown
    h('.btn-group', [
      h('button.btn.btn-default', {
        onclick: () => {
          const nameForNewLayout = prompt('Choose a name for the new layout:').trim();
          model.layout.duplicate(nameForNewLayout);
        },
        title: 'Duplicate layout',
      }, iconLayers()),
      h('a.btn.btn-default', {
        title: 'Export layout skeleton as JSON file',
        href: `data:application/octet;,${encodeURIComponent(LayoutUtils.toSkeleton(model.layout.item))}`,
        download: `layout-${model.layout.item.name}-skeleton.json`,
      }, iconShareBoxed()),
      model.session.personid == model.layout.item.owner_id && [
        h('button.btn.btn-primary', {
          onclick: () => model.layout.edit(),
          title: 'Edit layout',
        }, iconPencil()),
        h('button.btn.btn-danger', {
          onclick: () => confirm('Are you sure to delete this layout?') && model.layout.deleteItem(),
          title: 'Delete layout',
        }, iconTrash()),
      ],
    ]),
  ]),
];

/**
 * Single tab button in view mode to change tab of current layout
 * @param {Model} model - root model of the application
 * @param {Object} tab - tab dto representation
 * @param {Object} i - index of tab in the model array of tabs
 * @returns {vnode} - virtual node element
 */
const toolbarViewModeTab = (model, tab, i) => {
  const linkClass = model.layout.tab.name === tab.name ? 'selected' : '';

  /**
   * Handler when user click on a tab to select it
   * @return {undefined}
   */
  const selectTab = () => model.layout.selectTab(i);

  return [
    h('button.br-pill.ph2.btn.btn-tab', { class: linkClass, onclick: selectTab }, tab.name),
    ' ',
  ];
};

/**
 * Toolbar in edit mode (center and right) with rename, trash, save buttons
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const toolbarEditMode = (model) => [
  h('.w-50.text-center', [
    h('div', { class: 'header-layout' }, [
      h('span', model.layout.item.tabs.map((tab, i) => toolbarEditModeTab(model, tab, i))),
      h('.btn-group', [
        tabBtn({
          title: 'Add new tab to this layout',
          class: 'default',
          onclick: () => {
            const name = prompt('Enter the name of the new tab:');
            if (name) {
              model.layout.newTab(name);
            }
          },
        }, iconPlus()),
      ]),
    ]),
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline', {
      type: 'text',
      value: model.layout.item.name,
      oninput: (e) => {
        model.layout.item.name = e.target.value.trim();
      },
    }),
    h('.btn-group.m1', [
      h('button.btn.btn-primary', {
        onclick: () => model.layout.save(),
        title: 'Save layout',
      }, iconCheck()),
      h('button.btn', {
        onclick: () => model.layout.cancelEdit(),
        title: 'Cancel',
      }, iconBan()),
    ]),
  ]),
];

/**
 * Single tab button in edit mode (with rename and trash buttons when selected)
 * @param {Model} model - root model of the application
 * @param {Object} tab - tab dto representation
 * @param {Object} i - index of tab in array of model
 * @returns {vnode} - virtual node element
 */
const toolbarEditModeTab = (model, tab, i) => {
  const selected = model.layout.tab.name === tab.name;
  const linkClass = selected ? 'selected' : '';

  /**
   * Handler when user click on a tab to select it
   * @return {undefined}
   */
  const selectTab = () => model.layout.selectTab(i);

  /**
   * Handler when user click on rename icon
   * @returns {undefined}
   */
  const renameTab = () => {
    const newName = prompt('Enter a new name for this tab:', tab.name);
    if (newName) {
      model.layout.renameTab(i, newName);
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
        resizeGridTabDropDown(model, tab),
        h('button.br-pill.ph2.btn.btn-tab', {
          class: linkClass,
          onclick: () => model.layout.deleteTab(i),
          title: 'Delete tab',
        }, iconTrash()),
      ],
    ]),
    ' ',
  ];
};

/**
 * Dropdown for resizing the tab of a layout
 * @param {Model} model - root model of the application
 * @param {Object} tab - tab dto representation
 * @returns {vnode} - virtual node element
 */
const resizeGridTabDropDown = (model, tab) =>
  h('select.form-control.select-tab', {
    style: 'cursor: pointer',
    title: 'Resize grid of the tab',
    onchange: (e) => model.layout.resizeGridByXY(e.target.value),
  }, [
    h('option', { selected: tab && tab.columns === 2, title: 'Resize layout to 2 columns', value: 2 }, '2 cols'),
    h('option', { selected: tab && tab.columns === 3, title: 'Resize layout to 3 columns', value: 3 }, '3 cols'),
    h('option', { selected: tab && tab.columns === 4, title: 'Resize layout to 4 columns', value: 4 }, '4 cols'),
    h('option', { selected: tab && tab.columns === 5, title: 'Resize layout to 5 columns', value: 5 }, '5 cols'),
  ]);

/**
 * Single tab button
 * @param {Object} args - arguments to be passed to button
 * @return {vnode} - virtual node element
 */
const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);
