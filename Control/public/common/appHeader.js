import {h, iconPerson} from '/js/src/index.js';
import lockButton from '../lock/lockButton.js';

/**
 * Application header (left part): lockpad button and application name
 */
export default (model) => h('.flex-grow text-left', [
  loginButton(model),
  ' ',
  lockButton(model),
  ' ',
  h('span.f4 gray', 'Control')
]);

const loginButton = (model) => h('.dropdown', {class: model.accountMenuEnabled ? 'dropdown-open' : ''}, [
  h('button.btn', {onclick: () => model.toggleAccountMenu()}, iconPerson()),
  h('.dropdown-menu', [
    h('p.m3.mv2.text-ellipsis', `Welcome ${model.session.name}`),
    model.session.personid === 0 // anonymous user has id 0
     ? h('p.m3.gray-darker', 'You are connected as anonymous, no authentification needed for this application.')
     : h('a.menu-item', {onclick: () => alert(`Not implemented`)}, 'Logout'),
  ]),
]);
