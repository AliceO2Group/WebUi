import {h} from '/js/src/index.js';
import {iconGridFourUp, iconGridThreeUp, iconGridTwoUp, iconExcerpt} from '/js/src/icons.js';

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

  h('.menu-title', 'Listing'),
  h('a.menu-item', {
    href: '?page=environments',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'environments' ? 'selected' : ''
  }, [
    iconGridTwoUp(),
    ' ',
    'Environments'
  ]),
  h('a.menu-item', {
    href: '?page=roles',
    onclick: (e) => model.router.handleLinkEvent(e),
    class: model.router.params.page === 'roles' ? 'selected' : ''
  }, [
    iconGridThreeUp(),
    ' ',
    'Roles'
  ]),
  h('a.menu-item', [
    iconGridFourUp(),
    ' ',
    '...'
  ]),
]);
