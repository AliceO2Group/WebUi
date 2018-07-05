import {h} from '/js/src/index.js';

import sidebar from './common/sidebar.js';
import header from './common/header.js';

import layoutListPage from './layout/layoutListPage.js';
import layoutShowPage from './layout/layoutShowPage.js';
import objectTreePage from './object/objectTreePage.js';

// View
export default (model) => h('.absolute-fill.flex-column', [
  h('header.shadow-level2.level2', [
    header(model),
  ]),
  h('.flex-grow.flex-row.outline-gray', [
    sidebar(model),
    h('section.outline-gray.flex-grow.relative', page(model))
  ])
]);

// Pages switch
function page(model) {
  switch (model.page) {
    case 'layoutList': return layoutListPage(model); break;
    case 'layoutShow': return layoutShowPage(model); break;
    case 'objectTree': return objectTreePage(model); break;

    // Should be seen only at the first start when the view is not yet really to be shown (data loading)
    default: return null;
  }
}
