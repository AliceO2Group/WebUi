import {h} from '/js/src/index.js';

export default () => h('.atom-spinner',
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
);
