import {h} from '/js/src/index.js';

/**
 * Shows header of list of layouts with one search input to filter them
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  h('.w-50.text-center', [
    h('b.f4', 'Layouts'),
    ' ',
    h('span', `(${howManyItems(model)})`),
  ]),
  h('.flex-grow.text-right', [
    h('input.form-control.form-inline.mh1.w-33', {
      placeholder: 'Search',
      type: 'text',
      value: model.layout.searchInput,
      oninput: (e) => model.layout.search(e.target.value)
    })
  ]),
];

/**
 * Shows how many layouts are available or correspond to the filtering input
 * @param {Object} model
 * @return {vnode}
 */
const howManyItems = (model) => model.layout.searchResult
  ? `${model.layout.searchResult.length} found of ${model.layout.list.length}`
  : `${model.layout.list.length} items`;
