import {h} from '/js/src/index.js';
import {iconExcerpt} from '/js/src/icons.js';

/**
 * Generic page loading placeholder
 * @return {vnode}
 */
export default () => h('span.pageLoading', iconExcerpt());
