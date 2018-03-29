import {h} from '/js/src/index.js';

export default function objectPropertiesSidebar(model) {
  return h('.p2', [
    h('div', model.layout.editingTabObject.name),
    h('.flex-row', [
      h('button.button.alert.flex-grow.m1', {onclick: () => model.layout.deleteTabObject(model.layout.editingTabObject)}, 'Delete'),
      ' ',
      h('button.button.primary.flex-grow.m1', {onclick: () => model.layout.editTabObject(null)}, 'Finish'),
    ]),

    h('hr'),

    h('div', 'Size'),
    h('.flex-row.f6', [
      btnSize(1, 1), ' ',
      btnSize(2, 1), ' ',
      btnSize(3, 1), ' ',
    ]),
    h('.flex-row.f6', [
      btnSize(1, 2), ' ',
      btnSize(2, 2), ' ',
      btnSize(3, 2), ' ',
    ]),
    h('.flex-row.f6', [
      btnSize(1, 3), ' ',
      btnSize(2, 3), ' ',
      btnSize(3, 3), ' ',
    ]),

    h('hr'),

    h('div', 'Options'),
    h('.flex-row', [
      h('button.button.default.flex-grow.m1', 'Linear'),
      ' ',
      h('button.button.default.flex-grow.m1', 'Log'),
    ]),
  ]);
}

const btnSize = (width, height) => h('button.button.default.flex-grow.m1', {
  onclick: () => model.layout.resizeTabObject(model.layout.editingTabObject, width, height),
  class: model.layout.editingTabObject.w === width && model.layout.editingTabObject.h === height ? 'active' : ''
}, `${width}x${height}`);
