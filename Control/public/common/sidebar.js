import {h} from '/js/src/index.js';
import {iconGridTwoUp, iconExcerpt, iconPlus} from '/js/src/icons.js';

/**
 * Sidebar is the main navigation menu to choose pages though QueryRouter instance
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.absolute-fill scroll-y', [
  h('.menu-title-large', 'Dashboard'),
  h('a.menu-item', {
    href: '?page=status',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'status' ? 'selected' : ''
  }, [
    iconExcerpt(),
    ' ',
    'Status'
  ]),

  h('h5.menu-title-large', 'Environments'),
  h('a.menu-item', {
    href: '?page=newEnvironment',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'newEnvironment' ? 'selected' : ''
  }, [
    iconPlus(),
    ' ',
    'Create'
  ]),
  h('a.menu-item', {
    href: '?page=environments',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'environments' ? 'selected' : ''
  }, [
    iconGridTwoUp(),
    ' ',
    'Active'
  ])
]);
