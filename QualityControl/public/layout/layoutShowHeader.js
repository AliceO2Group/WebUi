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
        onclick: () => model.layout.duplicate( model.layout.item.id),
        title: 'Duplicate layout'
      },
      iconLayers()),
      model.session.personid == model.layout.item.owner_id && h('button.btn.btn-primary', {
        onclick: () => model.layout.edit(),
        title: 'Edit layout'
      },
      iconPencil())
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
        tabBtn({class: 'default', onclick: () => {
          const name = prompt('Enter the name of the new tab:');
          if (name) {
            model.layout.newTab(name);
          }
        }}, iconPlus()),
      ]),
    ])
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline', {
      type: 'text',
      value: model.layout.item.name,
      oninput: (e) => model.layout.item.name = e.target.value
    }
    ),
    h('.btn-group.m1', [
      h('button.btn.btn-primary', {
        onclick: () => model.layout.save(),
        title: 'Save layout'
      },
      iconCheck()
      ),
      h('button.btn', {
        onclick: () => model.layout.cancelEdit(),
        title: 'Cancel'
      },
      iconBan()),
    ]),
    h('button.btn.btn-danger', {
      onclick: () => confirm('Are you sure to delete this layout?') && model.layout.deleteItem(),
      title: 'Delete layout'
    },
    iconTrash()
    )
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
      selected && h('button.br-pill.ph2.btn.btn-tab', {
        class: linkClass,
        onclick: renameTab,
        title: 'Rename tab'
      }, iconPencil()),
      selected && h('button.br-pill.ph2.btn.btn-tab', {
        class: linkClass,
        onclick: () => model.layout.deleteTab(i),
        title: 'Delete tab'
      }, iconTrash()),
    ]),
    ' '
  ];
};

/**
 * Single tab button
 * @param {Object} args - arguments to be passed to button
 * @return {vnode}
 */
const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);
