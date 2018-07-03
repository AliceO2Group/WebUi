import {h} from '/js/src/index.js';

import sidebar from './common/sidebar.js';
import header from './common/header.js';

import layoutList from './layout/layoutList.js';
import layoutShow from './layout/layoutShow.js';
import {objectTree} from './object/objectTree.js';

export default function view(model) {
  return layout(model, page(model));
}

function page(model) {
  switch (model.page) {
    case 'layoutList': return layoutList(model); break;
    case 'layoutShow': return layoutShow(model); break;
    case 'objectTree': return objectTree(model); break;
    default: return blank(model);
  }
}

function layout(model, content) {
  return h('.absolute-fill.flex-column', [
    h('header.shadow-level2.level2', [
      header(model),
    ]),
    h('.flex-grow.flex-row.outline-gray', [
      sidebar(model),
      h('section.outline-gray.flex-grow.relative', content)
    ])
  ]);
}

// Should be seen only at the first start when the view is not yet really to be shown (data loading)
function blank(model) {
  return h('div')
}
