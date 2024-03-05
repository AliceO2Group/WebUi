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

import { h } from '/js/src/index.js';
import { iconChevronBottom, iconChevronTop, iconBadge } from '/js/src/icons.js';
import { UserRole, isUserRoleSufficient } from './../../../library/userRole.enum.js';

/**
 * Shows a list of layouts grouped by user and more
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default function layouts(model) {
  return h('.scroll-y.absolute-fill', {
    style: 'display: flex; flex-direction: column',
  }, [
    Array.from(model.folder.map.values())
      .map((folder) => createFolder(model, folder)),
  ]);
}

/**
 * Method to create a folder with various layouts
 * @param {Model} model - root model of the application
 * @param {Folder} folder - folder model
 * @returns {vnode} - virtual node element
 */
function createFolder(model, folder) {
  const layouts = folder.list;
  const searchBy = folder.searchInput;
  return h(
    '.m2.shadow-level3.br3.flex-column',
    [
      createHeaderOfFolder(model, folder),
      ' ',
      folder.isOpened ? table(model, layouts, searchBy) : null,
    ],
  );
}

/**
 * Create the header of the folder
 * @param {Model} model - root model of the application
 * @param {Folder} folder - folder model
 * @returns {vnode} - virtual node element
 */
function createHeaderOfFolder(model, folder) {
  return h(
    '.p2.object-selectable',
    {
      style: 'border-radius: .5rem .5rem 0 0; display: flex; flex-direction: row',
      class: folder.classList,
      onclick: () => model.folder.toggleFolder(folder.title),
    },
    [
      h('b', { style: 'flex-grow:1;' }, [
        h('span', {
          style: ' text-align: right',
        }, folder.isOpened ? iconChevronTop() : iconChevronBottom()), ' ', folder.title,
      ]),
    ],
  );
}

/**
 * Shows a table containing layouts, one per line
 * @param {Model} model - root model of the application
 * @param {RemoteData} layouts - list of layouts as remoteData object
 * @param {string} searchBy - string to search by in the list of layouts
 * @returns {vnode} - virtual node element
 */
function table(model, layouts, searchBy) {
  return [
    h(
      'table.table.table-sm',
      [
        h(
          'thead',
          h(
            'tr',
            [
              h('th', h('.text-center', 'Official')),
              h('th', 'Name'),
              h('th', 'Owner'),
              h('th', 'Description'),
              h('th', h('.text-right', 'Actions')),
            ],
          ),
        ),
        h('tbody', rows(model, layouts, searchBy)),
      ],
    ),
  ];
}

/**
 * Shows layouts as table lines
 * @param {Model} model - root model of the application
 * @param {RemoteData} layouts - list of layouts as remoteData object
 * @param {string} searchBy - string to search by in the list of layouts
 * @returns {vnode} - virtual node element
 */
function rows(model, layouts, searchBy) {
  return layouts.match({
    NotAsked: () => null,
    Loading: () => h('', 'Loading...'),
    Failure: () => h('tr', [h('td', 'Unable to retrieve this list of layouts')]),
    Success: (list) => {
      if (!list || list.length <= 0) {
        return h('tr', [h('td', 'No layouts found')]);
      }
      return list.filter((item) => item.name.match(searchBy))
        .map((layout) => {
          const key = `key${layout.name}`;
          const { isOfficial } = layout;
          const isMinimumGlobal = model.session.access.some((role) => isUserRoleSufficient(role, UserRole.GLOBAL));
          const isOnline = model.layout.doesLayoutContainOnlineObjects(layout) ? 'success' : '';
          return h('tr', { key: key }, [
            h('td', {
            }, isOfficial ? h('.primary.f4.text-center', [iconBadge(), ' ']) : ' '),
            h('td.w-20', [
              h('.flex-row.items-center', { class: isOnline }, [
                h('a', {
                  href: `?page=layoutShow&layoutId=${layout.id}`,
                  onclick: (e) => model.router.handleLinkEvent(e),
                }, layout.name),
              ]),
            ]),
            h('td.w-30', layout.owner_name),
            h('td.w-30', layout.description ?? '-'),
            h('td', h('.text-right', [
              isMinimumGlobal && h('button.btn.btn-sm', {
                onclick: () => model.layout.toggleOfficial(layout.id, !layout.isOfficial),
              }, layout.isOfficial ? 'Un-official' : 'Official'),
            ])),
          ]);
        });
    },
  });
}
