import {h, iconBarChart, iconCaretRight, iconResizeBoth, iconCaretBottom} from '/js/src/index.js';
import {draw} from './objectDraw.js';
import infoButton from './../common/infoButton.js';

/**
 * Shows a page to explore though a tree of objects with a preview on the right if clicked
 * and a status bar for selected object name and # of objects
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.flex-column.absolute-fill', {key: model.router.params.page}, [
  h('.flex-row.flex-grow', {oncreate: () => model.object.loadList()},
    [
      h('.flex-grow.scroll-y', tableShow(model)),
      h('.animate-width.scroll-y',
        {
          style: {
            width: model.object.selected ? '50%' : 0
          }
        },
        model.object.selected ? drawComponent(model) : null)
    ]
  ),
  h('.f6.status-bar.ph1.flex-row', [
    statusBarLeft(model),
    statusBarRight(model),
  ])
]);

/**
 * Method to generate a component containing a header with actions and a jsroot plot
 * @param {Object} model
 * @return {vnode}
 */
function drawComponent(model) {
  return h('', {style: 'height:100%; display: flex; flex-direction: column'},
    [
      h('.resize-button.flex-row', [
        infoButton(model.object),
        h('.p1.text-left', {style: 'padding-bottom: 0;'},
          h('a.btn',
            {
              title: 'Open object plot in full screen',
              href: `?page=objectView&objectName=${model.object.selected.name}`,
              onclick: (e) => model.router.handleLinkEvent(e)
            }, iconResizeBoth()
          )
        )]),
      h('', {style: 'height:100%; display: flex; flex-direction: column'},
        draw(model, model.object.selected.name, {stat: true})
      )
    ]
  );
}

/**
 * Shows status of current tree with its options (online, loaded, how many)
 * @param {Object} model
 * @return {vnode}
 */
function statusBarLeft(model) {
  let itemsInfo;
  if (!model.object.currentList) {
    itemsInfo = 'Loading objects...';
  } else if (model.object.searchInput) {
    itemsInfo = `${model.object.searchResult.length} found of ${model.object.currentList.length} items`;
  } else {
    itemsInfo = `${model.object.currentList.length} items`;
  }

  return h('span.flex-grow', itemsInfo);
}

/**
 * Shows current selected object path
 * @param {Object} model
 * @return {vnode}
 */
const statusBarRight = (model) => model.object.selected
  ? h('span.right', model.object.selected.name)
  : null;

/**
 * Shows a tree of objects inside a table with indentation
 * @param {Object} model
 * @return {vnode}
 */
const tableShow = (model) => [
  h('table.table.table-sm.text-no-select', [
    h('thead', [
      h('tr', [
        h('th', {}, 'Name'),
        h('th', {style: {width: '6em'}}, 'Quality'),
      ])
    ]),
    h('tbody', [
      // The main table of the view can be a tree OR the result of a search
      treeRows(model),
      searchRows(model),
    ])
  ])
];

/**
 * Shows a list of lines <tr> of objects
 * @param {Object} model
 * @return {vnode}
 */
const treeRows = (model) => !model.object.tree
  ? null
  : model.object.tree.children.map((children) => treeRow(model, children, 0));

/**
 * Shows a line <tr> for search mode (no indentation)
 * @param {Object} model
 * @return {vnode}
 */
function searchRows(model) {
  return model.object.searchResult.map((item) => {
    const path = item.name;

    /**
     * Select `item` when clicked by user to show its preview
     * @return {Any}
     */
    const selectItem = () => model.object.select(item);
    const color = item.quality === 'good' ? 'success' : 'danger';
    const className = item && item === model.object.selected ? 'table-primary' : '';

    return h('tr.object-selectable', {key: path, title: path, onclick: selectItem, class: className}, [
      h('td.highlight', [
        iconBarChart(),
        ' ',
        item.name
      ]),
      h('td.highlight', {class: color}, item.quality),
    ]);
  });
}

/**
 * Shows a line <tr> of object represented by parent node `tree`, also shows
 * sub-nodes of `tree` as additional lines if they are open in the tree.
 * Indentation is added according to tree level during recursive call of treeRow
 * Tree is traversed in depth-first with pre-order (root then subtrees)
 * @param {Object} model
 * @param {ObjectTree} tree - data-structure containing an object per node
 * @param {number} level - used for indentation within recursive call of treeRow
 * @return {vnode}
 */
function treeRow(model, tree, level) {
  const color = tree.quality === 'good' ? 'success' : 'danger';
  const padding = `${level}em`;
  const levelDeeper = level + 1;
  const icon = tree.object ? iconBarChart() : (tree.open ? iconCaretBottom() : iconCaretRight()); // 1 of 3 icons
  const iconWrapper = h('span', {style: {paddingLeft: padding}}, icon);
  const children = tree.open ? tree.children.map((children) => treeRow(model, children, levelDeeper)) : [];
  const path = tree.path.join('/');
  const selectItem = tree.object ? () => model.object.select(tree.object) : () => tree.toggle();
  const className = tree.object && tree.object === model.object.selected ? 'table-primary' : '';

  return model.object.searchInput ? [] : [
    h('tr.object-selectable', {key: path, title: path, onclick: selectItem, class: className}, [
      h('td.highlight', [
        iconWrapper,
        ' ',
        tree.name
      ]),
      h('td.highlight', {class: color}, tree.quality),
    ]),
    children
  ];
}
