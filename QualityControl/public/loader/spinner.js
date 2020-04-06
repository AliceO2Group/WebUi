import {h} from '/js/src/index.js';

export default (size) => h('span.pageLoading', {
  style: size ? `font-size: ${size}em`: '',
}, h('.atom-spinner',
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
