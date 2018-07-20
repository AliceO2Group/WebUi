import {h} from '/js/src/index.js';
import {draw} from './objectDraw.js';
import {iconCaretBottom, iconCaretRight, iconBarChart} from '/js/src/icons.js';

export default (model) => h('.flex-column.h-100', [
  h('.m2.mv3', searchForm(model)),
  h('.h-100.scroll-y', treeTable(model)),
  objectPreview(model)
]);

const searchForm = (model) => [
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

// for the keys to be effective, we need one big array, array of array does not work
// so each array returned by treeRow call must be flatten in one unique array
const treeRows = (model) => model.object.tree
  ? model.object.tree.childrens.reduce(
      (flatArray, children) => flatArray.concat(treeRow(model, children, 0)),
      []
    )
  : null;

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
    key: `key-sidebar-tree-${path}`,
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

function searchRows(model) {
  return !model.object.searchResult ? null : model.object.searchResult.map(item => {
    const path = item.name;
    const color = item.status === 'active' ? 'success' : 'alert';
    const className = item && item === model.object.selected ? 'table-primary' : '';

    // UI events
    const onclick = () => model.object.select(item);
    const ondblclick = () => model.layout.addItem(item.name);
    const ondragstart = (e) => {
      const newItem = model.layout.addItem(item.name);
      model.layout.moveTabObjectStart(newItem);
    };

    const attr = {
      key: `key-sidebar-tree-${path}`,
      title: path,
      onclick,
      class: className,
      draggable: true,
      ondragstart,
      ondblclick
    };

    return h('tr', attr, [
      h('td.highlight.text-ellipsis', [
        iconBarChart(),
        ' ',
        item.name
      ])
    ]);
  });
}
