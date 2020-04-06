import {h} from '/js/src/index.js';
import {iconProject, iconArrowBottom, iconArrowTop} from '/js/src/icons.js';

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
    h('.w-33.text-center', [
      h('b.f4', 'Objects'),
      ' ',
      model.object.objectsRemote.isSuccess() && h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', [
      h('.dropdown', {
        title: 'Sort by', class: model.object.sortBy.open ? 'dropdown-open' : ''
      }, [
        h('button.btn', {
          title: 'Sort by',
          onclick: () => model.object.toggleSortDropdown()
        }, [model.object.sortBy.title, ' ', model.object.sortBy.icon]),
        h('.dropdown-menu.text-left', [
          !model.object.isOnlineModeEnabled
          && sortMenuItem(model, 'Created Time', 'Sort by time of creation ASC', iconArrowTop(), 'createTime', 1),
          !model.object.isOnlineModeEnabled
          && sortMenuItem(model, 'Created Time', 'Sort by time of creation DESC', iconArrowBottom(), 'createTime', -1),
          sortMenuItem(model, 'Name', 'Sort by name ASC', iconArrowTop(), 'name', 1),
          sortMenuItem(model, 'Name', 'Sort by name DESC', iconArrowBottom(), 'name', -1),

        ]),
      ]),
      ' ',
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

/**
 * Create a menu-item for sort-by dropdown
 * @param {Object} model
 * @param {string} shortTitle - title that gets displayed to the user
 * @param {string} title - title that gets displayed to the user on hover
 * @param {Icon} icon
 * @param {string} field - field by which sorting should happen
 * @param {number} order - {-1/1}/{DESC/ASC}
 * @return {vnode}
 */
const sortMenuItem = (model, shortTitle, title, icon, field, order) => h('a.menu-item', {
  title: title, style: 'white-space: nowrap;', onclick: () => model.object.sortTree(shortTitle, field, order, icon)
}, [
  shortTitle, ' ', icon
]);
