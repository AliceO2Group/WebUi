import {h} from '/js/src/index.js';
import {draw} from './objectDraw.js';
import {iconCaretBottom, iconCaretRight, iconBarChart} from '/js/src/icons.js';

export default function objectTreeSidebar(model) {
  return h('.flex-column.h-100', [
    h('.m2.mv3', searchForm(model)),
    h('.h-100.scroll-y', treeTable(model)),
    objectPreview(model)
  ]);
}

function searchForm(model) {
  return [
    h('input.form-control.w-100', {
      placeholder: 'Search',
      type: 'text',
      value: model.object.searchInput,
      oninput: (e) => model.object.search(e.target.value)
    }),
    model.object.onlineModeAvailable && h('.form-check.f6', [
      h('input.form-check-input', {
        type: 'checkbox',
        id: 'inputOnlineOnlyTreeSidebar',
        onchange: () => model.object.toggleMode(),
        checked: model.object.onlineMode
      }),
      h('label.form-check-label', {for: 'inputOnlineOnlyTreeSidebar'}, [
        'Online only'
      ])
    ])
  ];
}

function objectPreview(model) {
  if (!model.object.selected) {
    return null;
  }

  return h('.bg-white', {style: {height: '10em'}}, draw(model, model.object.selected.name));
}

function treeTable(model) {
  const attrs = {
    ondragend(e) {
      model.layout.moveTabObjectStop();
    }
  };

  return h('table.table.table-sm.text-no-select.flex-grow.f6', attrs, [
    h('tbody', [
      // The main table of the view can be a tree OR the result of a search
      model.object.searchInput ? searchRows(model) : treeRows(model),
    ])
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
    const className = item && item === model.object.selected ? 'table-primary' : '';

    return h('tr', {key: path, title: path, onclick: selectItem, class: className}, [
      h('td.highlight.text-ellipsis', [
        iconBarChart(),
        ' ',
        item.name
      ])
    ]);
  });
}

// Flatten the tree in a functional way
// Tree is traversed in depth-first with pre-order (root then subtrees)
function treeRow(model, tree, level) {
  // Don't show nodes without IS in online mode
  if (model.object.onlineMode && !tree.informationService) {
    return null;
  }

  // Tree construction
  const levelDeeper = level + 1;
  const subtree = tree.open ? tree.childrens.map(children => treeRow(model, children, levelDeeper)) : [];

  // UI construction
  const icon = tree.object ? iconBarChart() : (tree.open ? iconCaretBottom() : iconCaretRight()); // 1 of 3 icons
  const iconWrapper = h('span', {style: {paddingLeft: `${level}em`}}, icon);
  const path = tree.path.join('/');
  const className = tree.object && tree.object === model.object.selected ? 'table-primary' : '';
  const draggable = !!tree.object;

  // UI events
  const onclick = tree.object ? () => model.object.select(tree.object) : () => tree.toggle();
  const ondblclick = tree.object ? () => model.layout.addItem(tree.object.name) : null;
  const ondragstart = tree.object ? (e) => { const newItem = model.layout.addItem(tree.object.name); model.layout.moveTabObjectStart(newItem); } : null;

  const attr = {
    key: path,
    title: path,
    onclick,
    class: className,
    draggable,
    ondragstart,
    ondblclick
  };

  return [
    h('tr', attr, [
      h('td.text-ellipsis', [iconWrapper, ' ', tree.name])
    ]),
    ...subtree
  ];
}

