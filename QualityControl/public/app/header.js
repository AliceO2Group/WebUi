import {h} from '/js/src/index.js';
import {iconMenu} from '/js/src/icons.js';

import spinner from './Loader/spinner.js'
import layoutShowHeader from './layout/layoutShowHeader.js'
import layoutListHeader from './layout/layoutListHeader.js'
import objectTreeHeader from './object/objectTreeHeader.js'

export default function header(model) {
  return h('.flex-row.p2', [
    commonHeader(model),
    headerSpecific(model)
  ]);
}

function headerSpecific(model) {
  switch (model.page) {
    case 'layoutList': return layoutListHeader(model); break;
    case 'layoutShow': return layoutShowHeader(model); break;
    case 'objectTree': return objectTreeHeader(model); break;
    default: return defaultHeader(model);
  }
}

function defaultHeader(model) {
  return h(''); // fill the space
}

function commonHeader(model) {
  return h('.flex-grow', [
    h('button.btn.mh1', {onclick: e => model.toggleSidebar()}, iconMenu()),
    ' ',
    h('span.f4.gray', 'Quality Control'),
    model.loader.active && h('span.f4.mh1.gray', spinner())
  ]);
}
