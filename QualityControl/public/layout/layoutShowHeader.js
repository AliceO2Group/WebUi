import {h} from '/js/src/index.js';
import {iconPencil, iconTrash, iconPlus} from '/js/src/icons.js';

export default (model) => model.layout.item
  ? (model.layout.editEnabled ? toolbarEditMode(model) : toolbarViewMode(model))
  : null;

// This is the toolbar in view mode (center and right)
const toolbarViewMode = (model) => [
  h('.w-50.text-center', [
    h('div', {class: 'header-layout'}, [
      model.layout.item.tabs.map((tab, i) => toolbarViewModeTab(model, tab, i)),
    ])
  ]),
  h('.flex-grow.text-right', [
    h('b.f4', model.layout.item.name),
    ' ',
    // Show edit button only for owner of the layout shown
    model.session.personid == model.layout.item.owner_id && h('button.btn', {onclick: e => model.layout.edit()},
      [
        iconPencil()
      ]
    ),
  ]),
];

// Single tab button in view mode
const toolbarViewModeTab = (model, tab, i) => {
  const linkClass = model.layout.tab.name === tab.name ? 'selected' : '';
  const selectTab = () => model.layout.selectTab(i);

  return [
    h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: selectTab}, tab.name),
    ' '
  ]
};

// Toolbar in edit mode (center and right)
// With rename, trash, save buttons
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
    h('b', model.layout.item.name),
    ' ',
    h('button.btn.btn-danger.mh1', {onclick: () => confirm('Are you sure to delete this layout?') && model.layout.deleteItem()},
      'Delete'
    ),
    h('button.btn.btn-primary.mh1', {onclick: () => model.layout.save()},
      'Save'
    ),
    h('button.btn.mh1', {onclick: () => model.layout.cancelEdit()},
      'Cancel'
    ),
  ]),
];

// Single tab button in edit mode (with rename and trash buttons when selected)
const toolbarEditModeTab = (model, tab, i) => {
  const selected = model.layout.tab.name === tab.name;
  const linkClass = selected ? 'selected' : '';
  const selectTab = () => model.layout.selectTab(i);
  let deleteTab = () => {
    if (model.layout.item.tabs.length <= 1) {
      alert(`Please, add another tab before deleting the last one`);
      return;
    }

    if (confirm('Are you sure to delete this tab?')) {
      model.layout.deleteTab(i);
    }
  };

  let renameTab = () => {
    let newName = prompt('Enter a new name for this tab:', tab.name);
    if (newName) {
      model.layout.renameTab(i, newName);
    }
  };

  return [
    h('.btn-group', [
      h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: selectTab}, tab.name),
      selected && h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: renameTab, title: 'Rename tab'}, iconPencil()),
      selected && h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: deleteTab, title: 'Delete tab'}, iconTrash()),
    ]),
    ' '
  ]
};

const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);
