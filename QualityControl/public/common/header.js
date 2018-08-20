import {h, iconMenu, iconPerson} from '/js/src/index.js';

import spinner from '../loader/spinner.js';
import layoutShowHeader from '../layout/layoutShowHeader.js';
import layoutListHeader from '../layout/layoutListHeader.js';
import objectTreeHeader from '../object/objectTreeHeader.js';

/**
 * Shows header of the application, split with 3 parts:
 * - app part on left side
 * - page title on center
 * - page actions on right side
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.flex-row.p2', [
  commonHeader(model),
  headerSpecific(model)
]);

/**
 * Shows the page specific header (center and right side)
 * @param {Object} model
 * @return {vnode}
 */
const headerSpecific = (model) => {
  switch (model.page) {
    case 'layoutList': return layoutListHeader(model);
    case 'layoutShow': return layoutShowHeader(model);
    case 'objectTree': return objectTreeHeader(model);
    default: return null;
  }
};

/**
 * Shows app header, common to all pages (profil button + app title)
 * @param {Object} model
 * @return {vnode}
 */
const commonHeader = (model) => h('.flex-grow', [
  loginButton(model),
  ' ',
  h('button.btn.mh1', {onclick: () => model.toggleSidebar()}, iconMenu()),
  ' ',
  h('span.f4.gray', 'Quality Control'),
  model.loader.active && h('span.f4.mh1.gray', spinner())
]);

/**
 * Shows profil button to logout or check who is the current owner of session
 * @param {Object} model
 * @return {vnode}
 */
const loginButton = (model) => h('.dropdown', {class: model.accountMenuEnabled ? 'dropdown-open' : ''}, [
  h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
    model.session.personid === 0 // anonymous user has id 0
      ? h('p.m3.gray-darker', 'This instance of the application does not require authentication.')
      : h('a.menu-item', {onclick: () => alert(`Not implemented`)}, 'Logout'),
  ]),
]);
