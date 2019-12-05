import {h} from '/js/src/index.js';
import {iconGridTwoUp, iconExcerpt, iconPlus, iconMediaSkipBackward, iconMediaSkipForward} from '/js/src/icons.js';

/**
 * Sidebar is the main navigation menu to choose pages though QueryRouter instance
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.absolute-fill scroll-y.flex-column', [
  h('h5.menu-title-large.mh1',
    model.sideBarMenu ? 'Environments' : 'ENVS'),
  createNewEnvMenuItem(model),
  listActiveEnvMenuItem(model),
  h('', {style: 'flex-grow:1'}), // empty item to fill in space
  aboutMenuItem(model),
  collapseSidebarMenuItem(model),
]);

/**
 * Show link to creating a new environment
 * @param {Object} model
 * @return {vnode}
 */
const createNewEnvMenuItem = (model) =>
  h('a.menu-item', {
    style: 'display: flex',
    href: '?page=newEnvironment',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'newEnvironment' ? 'selected' : ''
  }, [h('span', iconPlus()), model.sideBarMenu && itemMenuText('Create')]
  );

/**
 * Show link to all active environments
 * @param {Object} model
 * @return {vnode}
 */
const listActiveEnvMenuItem = (model) =>
  h('a.menu-item', {
    style: 'display: flex',
    href: '?page=environments',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'environments' ? 'selected' : ''
  }, [h('span', iconGridTwoUp()), model.sideBarMenu && itemMenuText('Active')]
  );

/**
 * Show link to status page
 * @param {Object} model
 * @param {boolean} extendedSideBar
 * @return {vnode}
 */
const aboutMenuItem = (model) =>
  h('a.menu-item', {
    style: 'display: flex',
    href: '?page=about',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'about' ? 'selected' : ''
  }, [h('span', iconExcerpt()), model.sideBarMenu && itemMenuText('About')]
  );

/**
* Show link to status page
* @param {Object} model
* @return {vnode}
*/
const collapseSidebarMenuItem = (model) =>
  h('a.menu-item', {
    onclick: () => model.toggleSideBarMenu(),
  }, model.sideBarMenu ?
    [iconMediaSkipBackward(), itemMenuText('Collapse Sidebar')]
    : iconMediaSkipForward(),
  );

/**
 * Display text with item properties
 * @param {string} text
 * @return {vnode}
 */
const itemMenuText = (text) => h('span.ph2', text);
