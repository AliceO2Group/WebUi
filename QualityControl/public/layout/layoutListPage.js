import {h} from '/js/src/index.js';
import {iconBarChart, iconChevronBottom, iconChevronTop} from '/js/src/icons.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {Object} model
 * @return {vnode}
 */
export default function layouts(model) {
  return h('.scroll-y.absolute-fill',
    {
      style: 'display: flex; flex-direction: column'
    },
    [
      Array.from(model.folders.list.values()).map((folder) => createFolder(model, folder, []))
    ]
  );
}

/**
 * Method to create a folder with containing various layouts
 * @param {Object} model
 * @param {JSON} folder
 * @param {Array<Layout>} listOfLayouts
 * @return {vnode}
 */
function createFolder(model, folder, listOfLayouts) {
  return h('.m3.shadow-level3.br3',
    {style: 'display:flex; flex-direction:column;'},
    [
      createHeaderOfFolder(model, folder),
      ' ',
      folder.isOpened ? table(model) : null
    ]
  );
}

/**
 * Create the header of the folder
 * @param {Object} model
 * @param {string} folder
 * @return {vnode}
 */
function createHeaderOfFolder(model, folder) {
  return h('.bg-gray-light.p3',
    {style: 'border-radius: .5rem .5rem 0 0; display: flex; flex-direction: row'},
    [
      h('b', {style: 'flex-grow:1;'}, folder.title),
      ' ',
      h('button.btn', {
        style: ' text-align: right',
        onclick: () => model.folders.toggleFolder(folder.title)
      }, folder.isOpened ? iconChevronTop() : iconChevronBottom())
    ]
  );
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
              class: model.layout.doesLayoutContainOnlineObjects(layout) ? 'success' : ''
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
