import {h} from '/js/src/index.js';
import {draw} from './objectDraw.js';
import {iconCaretBottom, iconCaretRight, iconBarChart, iconResizeBoth} from '/js/src/icons.js';

/**
 * Tree of object, searchable, inside the sidebar.
 * Used to find objects and add them inside a layout
 * with page=layoutShow in edit mode.
 * It also contains a preview of selected object.
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.flex-column.h-100', [
  h('.m2.mv3', searchForm(model)),
  h('.h-100.scroll-y', treeTable(model)),
  objectPreview(model)
]);

/**
 * Shows an input to search though objects, shows also
 * a checkbox to filter only objects available though 'information service'
 * @param {Object} model
 * @return {vnode}
 */
const searchForm = (model) => [
  h('input.form-control.w-100', {
    placeholder: 'Search',
    type: 'text',
    value: model.object.searchInput,
    oninput: (e) => model.object.search(e.target.value)
  }),
  model.object.isOnlineModeEnabled && h('.form-check.f6', [
    h('input.form-check-input', {
      type: 'checkbox',
      id: 'inputOnlineOnlyTreeSidebar',
      onchange: (e) => model.object.toggleSideTree(e.target.checked)
    }),
    h('label.form-check-label', {for: 'inputOnlineOnlyTreeSidebar'}, [
      'Online only'
    ])
  ])
];

/**
 * Show a jsroot plot of selected object inside the tree of sidebar
 * @param {Object} model
 * @return {vnode}
 */
function objectPreview(model) {
  if (!model.object.selected) {
    return null;
  }

  return h('.bg-white', {style: {height: '10em'}}, drawComponent(model, model.object.selected.name));
}

/**
 * Method to generate a component containing a header with actions and a jsroot plot
 * @param {Object} model
 * @param {String} tabObject
 * @return {vnode}
 */
function drawComponent(model, tabObject) {
  return h('', {style: 'height:100%; display: flex; flex-direction: column'},
    [
      h('.text-right.', {style: 'padding: .25rem .25rem 0rem .25rem'},
        h('a.btn',
          {
            style: 'padding: 0.25em 0.5em',
            title: 'Open object plot in full screen',
            href: `?page=objectView&objectName=${tabObject}&layoutId=${model.router.params.layoutId}`,
            onclick: (e) => model.router.handleLinkEvent(e)
          }, h('span.f7', iconResizeBoth()))),
      h('', {style: 'height:100%; display: flex; flex-direction: column'},
        draw(model, tabObject))]);
}

/**
 * Shows table of objects
 * @param {Object} model
 * @return {vnode}
 */
function treeTable(model) {
  const attrs = {
    /**
     * Handler when a drag&drop has ended, when moving an object from the table
     */
    ondragend() {
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

/**
 * Shows a list of lines <tr> of objects
 * @param {Object} model
 * @return {vnode}
 */
const treeRows = (model) => !model.object.sideTree
  ? null
  : model.object.sideTree.children.map((children) => treeRow(model, children, 0));

/**
 * Shows a line <tr> for search mode (no indentation)
 * @param {Object} model
 * @return {vnode}
 */
function searchRows(model) {
  return !model.object.searchResult ? null : model.object.searchResult.map((item)=> {
    const path = item.name;
    const className = item && item === model.object.selected ? 'table-primary' : '';

    /**
     * Handler when line is clicked by user
     * @return {Any}
     */
    const onclick = () => model.object.select(item);

    /**
     * On double click object is added to tab
     * @return {Any}
     */
    const ondblclick = () => model.layout.addItem(item.name);

    /**
     * On drag start, inform model of the object moving
     */
    const ondragstart = () => {
      const newItem = model.layout.addItem(item.name);
      model.layout.moveTabObjectStart(newItem);
    };

    return h('tr', {key: path, title: path, onclick, ondblclick, ondragstart, class: className, draggable: true}, [
      h('td.highlight.text-ellipsis', [
        iconBarChart(),
        ' ',
        item.name
      ])
    ]);
  });
}

/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additionnals lines if they are open in the tree.
 * Indentation is added according to tree level during recurcive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Object} model
 * @param {ObjectTree} sideTree - data-structure containaing an object per node
 * @param {number} level - used for indentation within recurcive call of treeRow
 * @return {vnode}
 */
function treeRow(model, sideTree, level) {
  // sideTree construction
  const levelDeeper = level + 1;
  const subtree = sideTree.open ? sideTree.children.map((children) => treeRow(model, children, levelDeeper)) : [];

  // UI construction
  const icon = sideTree.object ? iconBarChart() : (sideTree.open ? iconCaretBottom() : iconCaretRight()); // 1 of 3 icons
  const iconWrapper = h('span', {style: {paddingLeft: `${level}em`}}, icon);
  const path = sideTree.path.join('/');
  const className = sideTree.object && sideTree.object === model.object.selected ? 'table-primary' : '';
  const draggable = !!sideTree.object;

  // UI events
  const onclick = sideTree.object ? () => model.object.select(sideTree.object) : () => sideTree.toggle();
  const ondblclick = sideTree.object ? () => model.layout.addItem(sideTree.object.name) : null;
  const ondragstart = sideTree.object ? () => {
    const newItem = model.layout.addItem(sideTree.object.name);
    model.layout.moveTabObjectStart(newItem);
  } : null;

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
    h('tr.object-selectable', attr, [
      h('td.text-ellipsis', [iconWrapper, ' ', sideTree.name])
    ]),
    ...subtree
  ];
}
