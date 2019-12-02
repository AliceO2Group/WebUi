import {h} from '/js/src/index.js';

/**
 * Generic page loading placeholder
 * @return {vnode}
 */
export default () => h('span.pageLoading',
  h('.atom-spinner',
    h('.spinner-inner',
      [
        h('.spinner-line'),
        h('.spinner-line'),
        h('.spinner-line'),
        h('.spinner-circle',
          h('div', '●')
        )
      ]
    )
  ));
