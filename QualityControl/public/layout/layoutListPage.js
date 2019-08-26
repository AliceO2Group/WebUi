import {h} from '/js/src/index.js';
import {iconBarChart, iconChevronBottom, iconChevronTop} from '/js/src/icons.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {Object} model
 * @return {vnode}
 */
export default function layouts(model) {
  return h('.scroll-y.absolute-fill', {
    style: 'display: flex; flex-direction: column'
  }, [
    Array.from(model.folder.map.values()).map((folder) => createFolder(model, folder, folder.list))
  ]
  );
}

/**
 * Method to create a folder with various layouts
 * @param {Object} model
 * @param {JSON} folder
 * @param {Array<Layout>} listOfLayouts
 * @return {vnode}
 */
function createFolder(model, folder, listOfLayouts) {
  return h('.m2.shadow-level3.br3',
    {style: 'display:flex; flex-direction:column;'},
    [
      createHeaderOfFolder(model, folder),
      ' ',
      folder.isOpened ? table(model, listOfLayouts.filter((item) => item.name.match(folder.searchInput))) : null
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
  return h('.bg-gray-light.p2.object-selectable',
    {
      style: 'border-radius: .5rem .5rem 0 0; display: flex; flex-direction: row',
      onclick: () => model.folder.toggleFolder(folder.title)
    },
    [
      h('b', {style: 'flex-grow:1;'}, [
        h('span', {
          style: ' text-align: right',
        }, folder.isOpened ? iconChevronTop() : iconChevronBottom()), ' ', folder.title]),
    ]
  );
}

/**
 * Shows a table containing layouts, one per line
 * @param {Object} model
 * @param {Array<Object>} listOfLayouts
 * @return {vnode}
 */
function table(model, listOfLayouts) {
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
        h('tbody', rows(model, listOfLayouts))
      ]
    )
  ];
}

/**
 * Shows layouts as table lines
 * @param {Object} model
 * @param {Array<Object>} listOfLayouts
 * @return {vnode}
 */
function rows(model, listOfLayouts) {
  return (!listOfLayouts || listOfLayouts <= 0) ?
    h('tr', [
      h('td.w-50', 'No layouts found'),
      h('td.w-25', ''),
      h('td.w-25', '')
    ])
    :
    listOfLayouts.map((layout) => {
      const key = `key${layout.name}`;
      return h('tr', {key: key}, [
        h('td.w-50', [
          h('', {class: model.layout.doesLayoutContainOnlineObjects(layout) ? 'success' : ''}, [
            iconBarChart(), ' ',
            h('a', {
              href: `?page=layoutShow&layoutId=${layout.id}&layoutName=${layout.name}`,
              onclick: (e) => model.router.handleLinkEvent(e)
            }, layout.name)
          ])
        ]),
        h('td.w-25', layout.owner_name),
        h('td.w-25', layout.popularity)
      ]
      );
    });
}
