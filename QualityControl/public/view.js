import {h, notification} from '/js/src/index.js';

import sidebar from './common/sidebar.js';
import header from './common/header.js';

import layoutListPage from './layout/layoutListPage.js';
import layoutShowPage from './layout/layoutShowPage.js';
import objectTreePage from './object/objectTreePage.js';
import objectViewPage from './object/view/objectViewPage.js';
import frameworkInfoPage from './frameworkInfo/frameworkInfoPage.js';


/**
 * Entry point to generate view of QCG as a tree of function calls
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => [
  model.page === 'objectView' ? objectViewPage(model) :
    h('.absolute-fill.flex-column', [
      h('header.shadow-level2.level2', [
        header(model),
      ]),
      h('.flex-grow.flex-row.outline-gray', [
        sidebar(model),
        h('section.outline-gray.flex-grow.relative', page(model))
      ])
    ]),
  notification(model.notification),
];

/**
 * Switch between pages of QCG according to router parameters
 * @param {Object} model
 * @return {vnode}
 */
function page(model) {
  switch (model.page) {
    case 'layoutList': return layoutListPage(model);
    case 'layoutShow': return layoutShowPage(model);
    case 'objectTree': return objectTreePage(model);
    case 'about': return frameworkInfoPage(model);

    // Should be seen only at the first start when the view is not yet really to be shown (data loading)
    default: return null;
  }
}
