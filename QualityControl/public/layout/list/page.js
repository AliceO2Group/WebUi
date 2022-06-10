/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

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
    Array.from(model.folder.map.values())
      .map((folder) => createFolder(model, folder))
  ]
  );
}

/**
 * Method to create a folder with various layouts
 * @param {Object} model
 * @param {Folder} folder
 * @return {vnode}
 */
function createFolder(model, folder) {
  return h('.m2.shadow-level3.br3',
    {style: 'display:flex; flex-direction:column;'},
    [
      createHeaderOfFolder(model, folder),
      ' ',
      folder.isOpened ? table(model, folder) : null
    ]
  );
}

/**
 * Create the header of the folder
 * @param {Object} model
 * @param {Folder} folder
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
 * @param {Folder} folder
 * @return {vnode}
 */
function table(model, folder) {
  return [
    h('table.table',
      [
        h('thead',
          h('tr',
            [
              h('th', 'Name'),
              h('th', 'Owner'),
            ]
          )
        ),
        h('tbody', rows(model, folder))
      ]
    )
  ];
}

/**
 * Shows layouts as table lines
 * @param {Object} model
 * @param {Folder} folder
 * @return {vnode}
 */
function rows(model, folder) {
  return folder.list.match({
    NotAsked: () => null,
    Loading: () => h('', 'Loading...'),
    Failure: () => h('tr', [
      h('td', 'Unable to retrieve this list of layouts'),
    ]),
    Success: (list) => {
      if (!list || list.length <= 0) {
        return h('tr', [
          h('td', 'No layouts found'),
        ]);
      }
      return list.map((layout) => {
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
        ]);
      });
    }
  });
}