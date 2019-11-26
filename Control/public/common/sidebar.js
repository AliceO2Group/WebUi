import {h} from '/js/src/index.js';
import {iconGridTwoUp, iconExcerpt, iconPlus} from '/js/src/icons.js';

/**
 * Sidebar is the main navigation menu to choose pages though QueryRouter instance
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.absolute-fill scroll-y.flex-column', [
  // h('.menu-title-large', 'Dashboard'),
  // h('a.menu-item', {
  //   href: '?page=status',
  //   onclick: (e) => model.router.handleLinkEvent(e),
  //   class: model.router.params.page === 'status' ? 'selected' : ''
  // }, [
  //   iconExcerpt(),
  //   ' ',
  //   'Status'
  // ]),
  h('h5.menu-title-large', 'Environments'),
  createNewEnvMenuItem(model.router),
  listActiveEnvMenuItem(model.router),
  h('', {style: 'flex-grow:1'}), // empty item to fill in space
  aboutMenuItem(model.router)
]);

/**
 * Show link to creating a new environment
 * @param {Object} router
 * @return {vnode}
 */
const createNewEnvMenuItem = (router) =>
  h('a.menu-item', {
    href: '?page=newEnvironment',
    onclick: (e) => router.handleLinkEvent(e),
    class: router.params.page === 'newEnvironment' ? 'selected' : ''
  }, [iconPlus(), ' ', 'Create']
  );

/**
 * Show link to all active environments
 * @param {Object} router
 * @return {vnode}
 */
const listActiveEnvMenuItem = (router) =>
  h('a.menu-item', {
    href: '?page=environments',
    onclick: (e) => router.handleLinkEvent(e),
    class: router.params.page === 'environments' ? 'selected' : ''
  }, [iconGridTwoUp(), ' ', 'Active']
  );

/**
 * Show link to status page
 * @param {Object} router
 * @return {vnode}
 */
const aboutMenuItem = (router) =>
  h('a.menu-item', {
    href: '?page=about',
    onclick: (e) => router.handleLinkEvent(e),
    class: router.params.page === 'about' ? 'selected' : ''
  }, [iconExcerpt(), ' ', h('span', 'About')]
  );
