import {h} from '/js/src/index.js';
import {iconCircleX} from '/js/src/icons.js';

/**
 * Display an iconCircleX and a red error message
 * @param {string} message
 * @return {vnode}
 */
export default (message) =>
  h('p.text-center.danger', iconCircleX(), ' ', message);
