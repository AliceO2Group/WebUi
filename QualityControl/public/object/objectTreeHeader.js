import {h} from '/js/src/index.js';
import {iconProject, iconSortDescending, iconArrowBottom, iconArrowTop} from '/js/src/icons.js';

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
      h('span', `(${howMany})`),
    ]),
    h('.flex-grow.text-right', {
    }, [
      // h('label', 'Sort by'),
      // h('select.form-control', {
      //   style: 'cursor: pointer',
      //   onchange: (e) => console.log("Clicked")
      // }, [
      //   h('option', 'First'),
      //   h('option', 'Second')
      // ]),
      h('.dropdown', {
        title: 'Sort by', class: model.object.sortDropdown ? 'dropdown-open' : ''
      }, [
        h('button.btn', {onclick: () => model.object.toggleSortDropdown()},
          ['Sort by', ' ', iconSortDescending()]),
        h('.dropdown-menu.text-left', [
          h('a.menu-item', {style: 'white-space: nowrap ;', onclick: () => model.object.sortTree('createTime', 1)}, [iconArrowBottom(), ' ', 'Creation']),
          h('a.menu-item', {style: 'white-space: nowrap ;', onclick: () => model.object.sortTree('createTime', -1)}, [iconArrowTop()], ' ', 'Creation'),
          h('a.menu-item', {style: 'white-space: nowrap ;', onclick: () => model.object.sortTree('name', 1)}, [iconArrowBottom(), ' ', 'Name']),
          h('a.menu-item', {style: 'white-space: nowrap ;', onclick: () => model.object.sortTree('name', -1)}, [iconArrowTop(), ' ', 'Name']),
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
