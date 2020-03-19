import {h, iconCircleX} from '/js/src/index.js';

/**
 * Generic page error with label, used on page load failed or access denied
 * @param {string} error
 * @return {vnode}
 */
export default (error) => h('.flex-column items-center justify-center', [
  h('span.errorPage', iconCircleX()),
  h('p.text-center.danger.measure-narrow', error)
]);
