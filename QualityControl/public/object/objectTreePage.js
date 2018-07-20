import {h} from '/js/src/index.js';
import {draw} from './objectDraw.js';

export default (model) => h('.flex-column.absolute-fill', {key: model.router.params.page}, [
  h('.flex-row.flex-grow', {oncreate: () => model.object.loadList()}, [
    h('.flex-grow.scroll-y', tableShow(model)),
    h('.animate-width.scroll-y', {style: {width: model.object.selected ? '50%' : 0}}, model.object.selected ? draw(model, model.object.selected.name) : null)
  ]),
  h('.f6.status-bar.ph1.flex-row', [
    statusBarLeft(model),
    statusBarRight(model),
  ])
]);

function statusBarLeft(model) {
  let itemsInfo;

  if (!model.object.list) {
    itemsInfo = 'Loading objects...';
  } else if (model.object.onlineMode) {
    if (!model.object.informationService) {
      itemsInfo = 'Waiting information service state...';
    } else if (model.object.searchInput) {
      itemsInfo = `${model.object.searchResult.length} found of ${model.object.listOnline.length} items (online mode)`;
    } else {
      itemsInfo = `${model.object.listOnline.length} items (online mode)`;
    }
  } else if (model.object.searchInput) {
    itemsInfo = `${model.object.searchResult.length} found of ${model.object.list.length} items`;
  } else {
    itemsInfo = `${model.object.list.length} items`;
  }

  return h('span.flex-grow', itemsInfo);
}

const statusBarRight = (model) => model.object.selected ? h('span.right', [
  model.object.selected.name
]) : null;

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
      model.object.searchInput ? searchRows(model) : treeRows(model),
    ])
  ])
];

// for the keys to be effective, we need one big array, array of array does not work
// so each array returned by treeRow call must be flatten in one unique array
const treeRows = (model) => model.object.tree
  ? model.object.tree.childrens.reduce(
      (flatArray, children) => flatArray.concat(treeRow(model, children, 0)),
      []
    )
  : null;

// Icons used
const openIcon = () => h('svg.icon.gray', {fill: 'currentcolor', viewBox: '0 0 8 8'},
  h('path', {d: 'M0 2l4 4 4-4h-8z'})
);
const closedIcon = () => h('svg.icon.gray', {fill: 'currentcolor', viewBox: '0 0 8 8'},
  h('path', {d: 'M2 0v8l4-4-4-4z'})
);
const objectIcon = () => h('svg.icon.black', {fill: 'currentcolor', viewBox: '0 0 8 8'},
  h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'})
);

// flatten the tree in a functional way
function treeRow(model, tree, level) {
  // Don't show nodes without IS in online mode
  if (model.object.onlineMode && !tree.informationService) {
    return null;
  }

  const color = tree.quality === 'good' ? 'success' : 'danger';
  const padding = `${level}em`;
  const levelDeeper = level + 1;
  const icon = tree.object ? objectIcon() : (tree.open ? openIcon() : closedIcon()); // 1 of 3 icons
  const iconWrapper = h('span', {style: {paddingLeft: padding}}, icon);
  const childrens = tree.open ? tree.childrens.map(children => treeRow(model, children, levelDeeper)) : [];
  const path = tree.path.join('/');
  const selectItem = tree.object ? () => model.object.select(tree.object) : () => tree.toggle();
  const className = tree.object && tree.object === model.object.selected ? 'table-primary' : '';

  return [
    h('tr', {key: path, title: path, onclick: selectItem, class: className}, [
      h('td.highlight', [
        iconWrapper,
        ' ',
        tree.name
      ]),
      h('td.highlight', {class: color}, tree.quality),
    ]),
    ...childrens
  ];
}

function searchRows(model) {
  return model.object.searchResult.map(item => {
    const path = item.name;
    const selectItem = () => model.object.select(item);
    const color = item.quality === 'good' ? 'success' : 'danger';
    const className = item && item === model.object.selected ? 'table-primary' : '';

    return h('tr', {key: path, title: path, onclick: selectItem, class: className}, [
      h('td.highlight', [
        objectIcon(),
        ' ',
        item.name
      ]),
      h('td.highlight', {class: color}, item.quality),
    ]);
  });
}
