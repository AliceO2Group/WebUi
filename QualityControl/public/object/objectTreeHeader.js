import {h} from '/js/src/index.js';
import {iconProject} from '/js/src/icons.js';

/**
 * Shows header for the objects tree page, buttons allow to open/close the entire tree,
 * filter only 'online' objects thanks to information service and a search input allow to filter
 * by name.
 * @param {Object} model
 * @return {vnode}
 */
export default function objectTreeHeader(model) {
  if (!model.object.currentList) {
    return null;
  }

  const howMany = model.object.searchInput
    ? `${model.object.searchResult.length} found of ${model.object.currentList.length}`
    : `${model.object.currentList.length} items`;

  return [
    h('.w-50.text-center', [
      h('b.f4', 'Objects'),
      ' ',
      h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', [
      h('button.btn', {
        title: 'Open or close whole tree',
        onclick: () => model.object.tree.toggleAll(),
        disabled: !!model.object.searchInput
      }, iconProject()),
      ' ',
      h('input.form-control.form-inline.mh1.w-33', {
        placeholder: 'Search',
        type: 'text',
        value: model.object.searchInput,
        oninput: (e) => model.object.search(e.target.value)
      })
    ]),
  ];
}
