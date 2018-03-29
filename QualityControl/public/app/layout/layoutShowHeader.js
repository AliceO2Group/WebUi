import {h} from '/js/src/index.js';
import {iconStar, iconEdit} from '../icons.js';

export default (model) => model.layout.editEnabled ? toolbarEditMode(model) : toolbarViewMode(model);

const toolbarViewMode = (model) => [
  h('.w-100.text-center', [
    h('div', {class: 'header-layout'}, [
      h('b', model.layout.item.name),
      h('.f6.no-select', [
        model.layout.item.tabs.map((folder, i) => {
          const linkClass = model.layout.tab.name === folder.name ? 'active' : '';
          const selectTab = () => model.layout.selectTab(i);

          return [
            h('.button-group', [
              h('button.br-pill.ph2.pointer.button.btn-xs.default', {class: linkClass, onclick: selectTab}, folder.name),
            ]),
            ' '
          ]
        }),
      ]),
    ])
  ]),
  h('.w-100.text-right', [
    // TODO
    // h('button.button.default.mh1', {onclick: e => alert('Not implemented')},
    //   iconStar()
    // ),
    // TODO
    // after personid is fixed, activate the next line so edit button is only for owner
    /*model.session.personid === model.layout.item.owner_id && */h('button.button.default', {onclick: e => model.layout.edit()},
      [
        iconEdit()
      ]
    ),
  ]),
];

const toolbarEditMode = (model) => [
  h('.w-100.text-center', [
    h('div', {class: 'header-layout'}, [
      h('b', model.layout.item.name),
      h('.f6.no-select', [
        model.layout.item.tabs.map((folder, i) => {
          const linkClass = model.layout.tab.name === folder.name ? 'active' : '';
          const selectTab = () => model.layout.selectTab(i);
          let deleteTab = () => confirm('Are you sure to delete this tab?') && model.layout.deleteTab(i);

          return [
            h('.button-group', [
              h('button.br-pill.ph2.pointer.button.btn-xs.default', {class: linkClass, onclick: selectTab}, folder.name),
              h('button.br-pill.ph2.pointer.button.btn-xs.default', {class: linkClass, onclick: deleteTab}, 'x'),
            ]),
            ' '
          ]
        }),
        h('.button-group', [
          tabBtn({class: 'default', onclick: () => {
            const name = prompt('Enter the name of the new tab:');
            if (name) {
              model.layout.newTab(name);
            }
          }}, '+'),
        ])
      ]),
    ])
  ]),
  h('.w-100.text-right', [
    h('button.button.alert.mh1', {onclick: () => confirm('Are you sure to delete this layout?') && model.layout.deleteItem()},
      'Delete layout'
    ),
    h('button.button.primary.mh1', {onclick: () => model.layout.save()},
      'Save'
    ),
    h('button.button.default.mh1', {onclick: () => model.layout.cancelEdit()},
      'Cancel'
    ),
  ]),
];

const tabBtn = (...args) => h('button.br-pill.ph2.pointer.button.btn-xs', ...args);
