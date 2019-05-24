import {h} from '/js/src/index.js';
import {iconBarChart} from '/js/src/icons.js';

/**
 * Shows a list of layouts
 * @param {Object} model
 * @return {vnode}
 */
export default function layouts(model) {
  return h('.scroll-y.absolute-fill', [
    table(model)
  ]);
}

/**
 * Shows a table containing layouts, one per line
 * @param {Object} model
 * @return {vnode}
 */
function table(model) {
  return [
    h('table.table',
      [
        h('thead',
          h('tr',
            [
              h('th', 'Name'),
              h('th', 'Owner'),
              h('th', 'Popularity')
            ]
          )
        ),
        h('tbody', rows(model))
      ]
    )
  ];
}

/**
 * Shows layouts as table lines
 * @param {Object} model
 * @return {vnode}
 */
function rows(model) {
  return (model.layout.searchResult || model.layout.list).map((layout) => {
    const key = `key${layout.name}`;

    return h('tr', {key: key},
      [
        h('td.w-33',
          [
            h('', {
              class: model.layout.doesLayoutContainOnlineObjects(layout) ? 'danger' : ''
            }, [
              iconBarChart(),
              ' ',
              h('a', {
                href: `?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}`,
                onclick: (e) => model.router.handleLinkEvent(e)
              }, layout.name)
            ])
          ]),
        h('td',
          layout.owner_name
        ),
        h('td',
          layout.popularity
        )
      ]
    );
  });
}
