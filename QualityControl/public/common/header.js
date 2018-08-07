import {h, iconMenu, iconPerson} from '/js/src/index.js';

import spinner from '../loader/spinner.js'
import layoutShowHeader from '../layout/layoutShowHeader.js'
import layoutListHeader from '../layout/layoutListHeader.js'
import objectTreeHeader from '../object/objectTreeHeader.js'

export default (model) => h('.flex-row.p2', [
  commonHeader(model),
  headerSpecific(model)
]);

const headerSpecific = (model) => {
  switch (model.page) {
    case 'layoutList': return layoutListHeader(model); break;
    case 'layoutShow': return layoutShowHeader(model); break;
    case 'objectTree': return objectTreeHeader(model); break;
    default: return null;
  }
}

const commonHeader = (model) => h('.flex-grow', [
  loginButton(model),
  ' ',
  h('button.btn.mh1', {onclick: e => model.toggleSidebar()}, iconMenu()),
  ' ',
  h('span.f4.gray', 'Quality Control'),
  model.loader.active && h('span.f4.mh1.gray', spinner())
]);

const loginButton = (model) => h('.dropdown', {class: model.accountMenuEnabled ? 'dropdown-open' : ''}, [
  h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
    model.session.personid === 0 // anonymous user has id 0
     ? h('p.m3.gray-darker', 'This instance of the application does not require authentication.')
     : h('a.menu-item', {onclick: () => alert(`Not implemented`)}, 'Logout'),
  ]),
]);
