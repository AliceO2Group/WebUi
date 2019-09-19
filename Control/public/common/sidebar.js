import {h} from '/js/src/index.js';
import {iconGridTwoUp, iconExcerpt, iconListRich} from '/js/src/icons.js';

/**
 * Sidebar is the main navigation menu to choose pages though QueryRouter instance
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.absolute-fill scroll-y', [
  h('.menu-title', 'Dashboard'),
  h('a.menu-item', {
    href: '?page=status',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'status' ? 'selected' : ''
  }, [
    iconExcerpt(),
    ' ',
    'Status'
  ]),

  h('.menu-title', 'Control'),
  h('a.menu-item', {
    href: '?page=workflows',
    onclick: (e) => {
      model.workflows.useAll = false;
      model.router.handleLinkEvent(e);
    },
    class: model.router.params.page === 'workflows' ? 'selected' : ''
  }, [
    iconListRich(),
    ' ',
    'Workflows'
  ]),
  h('a.menu-item', {
    href: '?page=environments',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'environments' ? 'selected' : ''
  }, [
    iconGridTwoUp(),
    ' ',
    'Environments'
  ])
]);
