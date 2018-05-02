import {h} from '/js/src/index.js';
import {draw} from './objectDraw.js';

export function objectTree(model) {
  return h('.flex-column.absolute-fill', {key: model.router.params.page}, [
    h('.flex-row.flex-grow', {oncreate: () => model.object.loadList()}, [
      h('.flex-grow.scroll-y', tableShow(model)),
      h('.animate-width.scroll-y', {style: {width: model.object.selected ? '50%' : 0}}, model.object.selected ? draw(model, model.object.selected.name) : null)
    ]),
    h('.f6.status-bar.ph1', statusBar(model))
  ]);
}

function statusBar(model) {
  if (!model.object.list) {
    return h('span', [
      'Loading objects...'
    ]);
  }

  if (model.object.onlineMode) {
    if (!model.object.informationService) {
      return h('span', [
        'Waiting information service state...'
      ]);
    }

    if (model.object.searchInput) {
      return h('span', [
        `${model.object.searchResult.length} found of ${model.object.listOnline.length} items (online mode)`
      ]);
    }

    return h('span', [
      `${model.object.listOnline.length} items (online mode)`
    ]);
  }

  if (model.object.searchInput) {
    return h('span', [
      `${model.object.searchResult.length} found of ${model.object.list.length} items`
    ]);
  }

  return h('span', [
    `${model.object.list.length} items`
  ]);
}

export function tableShow(model) {
  return [
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
}

function treeRows(model) {
  return !model.object.tree ? null : model.object.tree.childrens.map(children => treeRow(model, children, 0));
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

// Icons used
function openIcon() {
  return h('svg.icon.gray', {fill: 'currentcolor', viewBox: '0 0 8 8'},
    h('path', {d: 'M0 2l4 4 4-4h-8z'})
  );
}
function closedIcon() {
  return h('svg.icon.gray', {fill: 'currentcolor', viewBox: '0 0 8 8'},
    h('path', {d: 'M2 0v8l4-4-4-4z'})
  );
}
function objectIcon() {
  return h('svg.icon.black', {fill: 'currentcolor', viewBox: '0 0 8 8'},
    h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'})
  );
}

// flatten the tree in a functional way
function treeRow(model, tree, level) {
  const color = tree.quality === 'good' ? 'success' : 'danger';
  const padding = `${level}em`;
  const levelDeeper = level + 1;
  const icon = tree.object ? objectIcon() : (tree.open ? openIcon() : closedIcon()); // 1 of 3 icons
  const iconWrapper = h('span', {style: {paddingLeft: padding}}, icon);
  const childrens = tree.open ? tree.childrens.map(children => treeRow(model, children, levelDeeper)) : [];
  const path = tree.path.join('/');
  const selectItem = tree.object ? () => model.object.select(tree.object) : () => tree.toggle();
  const className = tree.object && tree.object === model.object.selected ? 'table-primary' : '';

  // Don't show nodes without IS in online mode
  if (model.object.onlineMode && !tree.informationService) {
    return [];
  }

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

