import {h} from '/js/src/index.js';

/**
 * Generic page loading placeholder
 * @param {number} size
 * @return {vnode}
 */
export default (size) => h('span.pageLoading',
  {
    style: size ? `font-size: ${size}em` : 'font-size: 10em'
  },
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
