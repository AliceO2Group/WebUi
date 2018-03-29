import {h} from '/js/src/index.js';

export default function objectPropertiesSidebar(model) {
  const tabObject = model.layout.editingTabObject;

  return h('.p2', [
    h('div', tabObject.name),
    h('.flex-row', [
      h('button.button.alert.flex-grow.m1', {onclick: () => model.layout.deleteTabObject(tabObject)}, 'Delete'),
      ' ',
      h('button.button.primary.flex-grow.m1', {onclick: () => model.layout.editTabObject(null)}, 'Finish'),
    ]),

    h('hr'),

    h('div', 'Size'),
    h('.flex-row.f6', [
      btnSize(model, tabObject, 1, 1), ' ',
      btnSize(model, tabObject, 2, 1), ' ',
      btnSize(model, tabObject, 3, 1), ' ',
    ]),
    h('.flex-row.f6', [
      btnSize(model, tabObject, 1, 2), ' ',
      btnSize(model, tabObject, 2, 2), ' ',
      btnSize(model, tabObject, 3, 2), ' ',
    ]),
    h('.flex-row.f6', [
      btnSize(model, tabObject, 1, 3), ' ',
      btnSize(model, tabObject, 2, 3), ' ',
      btnSize(model, tabObject, 3, 3), ' ',
    ]),

    h('hr'),

    h('div', 'Options'),
    h('.flex-row', [
      btnOption(model, tabObject, 'logx'),
      btnOption(model, tabObject, 'logy'),
    ]),
    h('.flex-row', [
      btnOption(model, tabObject, 'gridx'),
      btnOption(model, tabObject, 'gridy'),
    ]),
    h('.flex-row', [
      btnOption(model, tabObject, 'lego'),
    ]),
  ]);
}

const btnSize = (model, tabObject, width, height) => h('button.button.default.flex-grow.m1', {
  onclick: () => model.layout.resizeTabObject(tabObject, width, height),
  class: tabObject.w === width && tabObject.h === height ? 'active' : ''
},
  `${width}x${height}`);

const btnOption = (model, tabObject, option) => h('button.button.default.flex-grow.m1', {
  class: tabObject.options.indexOf(option) >= 0 ? 'active' : '',
  onclick: () => model.layout.toggleTabObjectOption(tabObject, option)
},
  option);

