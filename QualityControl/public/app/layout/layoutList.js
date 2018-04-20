import {h} from '/js/src/index.js';

export default function layouts(model) {
  return h('.scroll-y.absolute-fill', [
    table(model)
  ]);
}

function table(model) {
  return [
    h('table.table',
      [
        h('thead',
          h('tr',
            [
              h('th',
                'Name'
              ),
              h('th',
                'Owner'
              ),
              h('th',
                'Popularity'
              )
            ]
          )
        ),
        h('tbody',
          rows(model)
        )
      ]
    )
  ];
}

function rows(model) {
  return (model.layout.searchResult || model.layout.list).map(layout => {
    const key = `key${layout.name}`;

    return h('tr', {key: key},
      [
        h('td.w-33',
          [
            h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 8 8'},
              h('path', {d: 'M0 0v7h8v-1h-7v-6h-1zm5 0v5h2v-5h-2zm-3 2v3h2v-3h-2z'})
            ),
            ' ',
            h('a', {href: `?page=layoutShow&layout=${layout.name}`, onclick: e => model.router.handleLinkEvent(e)}, layout.name)
          ]
        ),
        h('td',
          layout.owner_name
        ),
        h('td',
          layout.popularity
        )
      ]
    )
  });
}
