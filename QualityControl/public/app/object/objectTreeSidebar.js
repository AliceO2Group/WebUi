import {h} from '/js/src/index.js';
import {draw} from './objectDraw.js';
import {iconCaretBottom, iconCaretRight, iconBarChart} from '../icons.js';

export default function objectTreeSidebar(model) {
  return tabShow(model);
}

export function tabShow(model) {
  const attrs = {
    ondragend(e) {
      model.layout.moveTabObjectStop();
    }
  };
  return h('.flex-column.h-100', {oncreate: () => model.object.loadList()}, [
    h('.m2', [
      h('input.form-control.w-100', {placeholder: 'Search', type: 'search', value: model.object.searchInput, oninput: (e) => model.object.search(e.target.value)})
    ]),
    h('.h-100.scroll-y', [
      h('table.table.table-condensed.no-select.flex-grow.f6', attrs, [
        h('tbody', [
          // The main table of the view can be a tree OR the result of a search
          model.object.searchInput ? searchRows(model) : treeRows(model)
        ])
      ]),
    ]),
    h('', {style: {height: '15em'}, class: model.object.selected ? 'bg-white' : ''}, model.object.selected && draw(model, model.object.selected))
  ]);
}

function treeRows(model) {
  return !model.object.tree ? null : model.object.tree.childrens.map(children => treeRow(model, children, 0));
}

function searchRows(model) {
  return !model.object.searchResult ? null : model.object.searchResult.map(item => {
    const path = item.name;
    const selectItem = () => model.object.select(item);
    const color = item.status === 'active' ? 'success' : 'alert';
    const className = item && item === model.object.selected ? 'selected' : '';

    return h('tr', {key: path, title: path, onclick: selectItem, class: className}, [
      h('td.highlight.ellipsis', [
        objectIcon(),
        ' ',
        item.name
      ])
    ]);
  });
}

// flatten the tree in a functional way
function treeRow(model, tree, level) {
  // Tree construction
  const levelDeeper = level + 1;
  const childrens = tree.open ? tree.childrens.map(children => treeRow(model, children, levelDeeper)) : [];

  // UI construction
  const icon = tree.object ? iconBarChart() : (tree.open ? iconCaretBottom() : iconCaretRight()); // 1 of 3 icons
  const iconWrapper = h('span', {style: {paddingLeft: `${level}em`}}, icon);
  const path = tree.path.join('/');
  const className = tree.object && tree.object === model.object.selected ? 'selected' : '';
  const draggable = !!tree.object;

  // UI events
  const onclick = tree.object ? () => model.object.select(tree.object) : () => tree.toggle();
  const ondragstart = tree.object ? (e) => { const newItem = model.layout.addItem(tree.object.name); model.layout.moveTabObjectStart(newItem); } : null;

  return [
    h('tr', {key: path, title: path, onclick, class: className, draggable, ondragstart}, [
      h('td.ellipsis', {}, [
        iconWrapper,
        ' ',
        tree.name
      ])
    ]),
    ...childrens
  ];
}

