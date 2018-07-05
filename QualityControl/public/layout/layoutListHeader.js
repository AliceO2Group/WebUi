import {h} from '/js/src/index.js';

export default (model) => [
  h('.w-50.text-center', [
    h('b.f4', 'Layouts'),
    ' ',
    h('span', `(${howManyItems(model)})`),
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline.mh1.w-33', {placeholder: 'Search', type: 'text', value: model.layout.searchInput, oninput: e => model.layout.search(e.target.value)})
  ]),
];

const howManyItems = (model) => model.layout.searchResult
    ? `${model.layout.searchResult.length} found of ${model.layout.list.length}`
    : `${model.layout.list.length} items`;
