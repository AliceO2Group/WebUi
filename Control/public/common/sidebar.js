import {h} from '/js/src/index.js';
import {
  iconGridTwoUp, iconExcerpt, iconPlus, iconMediaSkipBackward, iconMediaSkipForward, iconCog
} from '/js/src/icons.js';

/**
 * Sidebar is the main navigation menu to choose pages though QueryRouter instance
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.absolute-fill scroll-y.flex-column', [
  h('h5.menu-title-large.mh1',
    model.sideBarMenu ? 'Environments' : 'ENVS'),
  menuItem(model, 'Create', 'newEnvironment', iconPlus()),
  menuItem(model, 'Active', 'environments', iconGridTwoUp()),
  // menuItem(model, 'Configuration', 'configuration', iconCog()),
  h('', {style: 'flex-grow:1'}), // empty item to fill in space
  menuItem(model, 'About', 'about', iconExcerpt()),
  collapseSidebarMenuItem(model),
]);

/**
 * Create a menu-item
 * @param {Object} model
 * @param {string} title
 * @param {string} pageParam - where onclick() should navigate to
 * @param {icon} icon
 * @return {vnode}
 */
const menuItem = (model, title, pageParam, icon) =>
  h('a.menu-item', {
    title: title,
    style: 'display: flex',
    href: `?page=${pageParam}`,
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === pageParam ? 'selected' : ''
  }, [
    h('span', icon),
    model.sideBarMenu && itemMenuText(title)
  ]);

/**
* Show link to status page
* @param {Object} model
* @return {vnode}
*/
const collapseSidebarMenuItem = (model) =>
  h('a.menu-item', {
    title: 'Toggle Sidebar',
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
