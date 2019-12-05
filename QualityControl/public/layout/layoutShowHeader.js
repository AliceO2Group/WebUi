import {h} from '/js/src/index.js';
import {iconPencil, iconTrash, iconPlus, iconLayers, iconCheck, iconBan} from '/js/src/icons.js';

/**
 * Shows header of page showing one layout with edit button, and other buttons in edit mode. (center and right)
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => model.layout.item
  ? (model.layout.editEnabled ? toolbarEditMode(model) : toolbarViewMode(model))
  : null;

/**
 * This is the toolbar in view mode (center and right)
 * @param {Object} model
 * @return {vnode}
 */
const toolbarViewMode = (model) => [
  h('.w-50.text-center', [
    h('div', {class: 'header-layout'}, [
      model.layout.item.tabs.map((tab, i) => toolbarViewModeTab(model, tab, i)),
    ])
  ]),
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
        title: 'Duplicate layout'
      }, iconLayers()),
      model.session.personid == model.layout.item.owner_id && h('button.btn.btn-primary', {
        onclick: () => model.layout.edit(),
        title: 'Edit layout'
      }, iconPencil()),
      model.session.personid == model.layout.item.owner_id && h('button.btn.btn-danger', {
        onclick: () => confirm('Are you sure to delete this layout?') && model.layout.deleteItem(),
        title: 'Delete layout'
      }, iconTrash()
      )
    ])
  ])
];

/**
 * Single tab button in view mode to change tab of current layout
 * @param {Object} model
 * @param {Object} tab
 * @param {Object} i - index of tab in the model array of tabs
 * @return {vnode}
 */
const toolbarViewModeTab = (model, tab, i) => {
  const linkClass = model.layout.tab.name === tab.name ? 'selected' : '';

  /**
   * Handler when user click on a tab to select it
   * @return {nothing}
   */
  const selectTab = () => model.layout.selectTab(i);

  return [
    h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: selectTab}, tab.name),
    ' '
  ];
};

/**
 * Toolbar in edit mode (center and right)
 * With rename, trash, save buttons
 * @param {Object} model
 * @return {vnode}
 */
const toolbarEditMode = (model) => [
  h('.w-50.text-center', [
    h('div', {class: 'header-layout'}, [
      h('span', model.layout.item.tabs.map((tab, i) => toolbarEditModeTab(model, tab, i))),
      h('.btn-group', [
        tabBtn({
          title: 'Add new tab to this layout',
          class: 'default', onclick: () => {
            const name = prompt('Enter the name of the new tab:');
            if (name) {
              model.layout.newTab(name);
            }
          }
        }, iconPlus()),
      ]),
    ])
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline', {
      type: 'text',
      value: model.layout.item.name,
      oninput: (e) => model.layout.item.name = e.target.value.trim()
    }
    ),
    h('.btn-group.m1', [
      h('button.btn.btn-primary', {
        onclick: () => model.layout.save(),
        title: 'Save layout'
      }, iconCheck()
      ),
      h('button.btn', {
        onclick: () => model.layout.cancelEdit(),
        title: 'Cancel'
      }, iconBan()),
    ])
  ]),
];

/**
 * Single tab button in edit mode (with rename and trash buttons when selected)
 * @param {Object} model
 * @param {Object} tab
 * @param {Object} i - index of tab in array of model
 * @return {vnode}
 */
const toolbarEditModeTab = (model, tab, i) => {
  const selected = model.layout.tab.name === tab.name;
  const linkClass = selected ? 'selected' : '';

  /**
   * Handler when user click on a tab to select it
   * @return {nothing}
   */
  const selectTab = () => model.layout.selectTab(i);

  /**
   * Handler when user click on rename icon
   */
  const renameTab = () => {
    const newName = prompt('Enter a new name for this tab:', tab.name);
    if (newName) {
      model.layout.renameTab(i, newName);
    }
  };

  return [
    h('.btn-group', [
      h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: selectTab}, tab.name),
      selected && [
        h('button.br-pill.ph2.btn.btn-tab', {
          class: linkClass,
          onclick: renameTab,
          title: 'Rename tab'
        }, iconPencil()),
        resizeGridTabDropDown(model, tab),
        h('button.br-pill.ph2.btn.btn-tab', {
          class: linkClass,
          onclick: () => model.layout.deleteTab(i),
          title: 'Delete tab'
        }, iconTrash()),
      ]
    ]),
    ' '
  ];
};

/**
 * Dropdown for resizing the tab of a layout
 * @param {Object} model
 * @param {Object} tab
 * @return {vnode}
 */
const resizeGridTabDropDown = (model, tab) =>
  h('select.form-control.select-tab', {
    style: 'cursor: pointer',
    title: 'Resize grid of the tab',
    onchange: (e) => model.layout.resizeGridByXY(e.target.value),
  }, [
    h('option', {selected: tab && tab.columns === 2, title: 'Resize to have 2 columns', value: 2}, '2 cols'),
    h('option', {selected: tab && tab.columns === 3, title: 'Resize to have 3 columns', value: 3}, '3 cols'),
    h('option', {selected: tab && tab.columns === 4, title: 'Resize have 4 columns', value: 4}, '4 cols'),
    h('option', {selected: tab && tab.columns === 5, title: 'Resize have 5 columns', value: 5}, '5 cols')
  ]);

/**
 * Single tab button
 * @param {Object} args - arguments to be passed to button
 * @return {vnode}
 */
const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);
