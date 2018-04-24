import {h} from '/js/src/index.js';
import {iconStar, iconPencil} from '/js/src/icons.js';

export default (model) => model.layout.editEnabled ? toolbarEditMode(model) : toolbarViewMode(model);

const toolbarViewMode = (model) => [
  h('.w-50.text-center', [
    h('div', [
      model.layout.item.tabs.map((folder, i) => {
        const linkClass = model.layout.tab.name === folder.name ? 'selected' : '';
        const selectTab = () => model.layout.selectTab(i);

        return [
          h('.btn-group', [
            h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: selectTab}, folder.name),
          ]),
          ' '
        ]
      }),
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

const toolbarEditMode = (model) => [
  h('.w-50.text-center', [
    h('div', {class: 'header-layout'}, [
      model.layout.item.tabs.map((folder, i) => {
        const selected = model.layout.tab.name === folder.name;
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

        return [
          h('.btn-group', [
            h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: selectTab}, folder.name),
            selected && h('button.br-pill.ph2.btn.btn-tab', {class: linkClass, onclick: deleteTab}, 'x'),
          ]),
          ' '
        ]
      }),
      h('.btn-group', [
        tabBtn({class: 'default', onclick: () => {
          const name = prompt('Enter the name of the new tab:');
          if (name) {
            model.layout.newTab(name);
          }
        }}, '+'),
      ])
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

const tabBtn = (...args) => h('button.br-pill.ph2.btn', ...args);
