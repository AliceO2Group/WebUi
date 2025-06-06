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

import { spinner } from '../../common/spinner.js';
import virtualTable from '../../object/virtualTable.js';
import { branchItem, leafItem } from './component/objectTreeItem.js';
import { objectPanel, statusBarLeft, statusBarRight } from './component/objectPanel.js';
import ObjectTreeComponent from './component/ObjectTreeComponent.js';
import { h } from '/js/src/index.js';

/**
 * Shows a page to explore though a tree of objects with a preview on the right if clicked
 * and a status bar for selected object name and # of objects
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) => {
  const { object, router } = model;
  const { selected } = object;
  const treeWidthClass = selected ? '.w-50' : '.w-100';

  return h('.h-100.flex-column', { key: router.params.page }, [
    h('.flex-row.flex-grow', [
      h(`.scroll-y.flex-column${treeWidthClass}`, object.objectsRemote.match({
        NotAsked: () => null,
        Loading: () =>
          h('.absolute-fill.flex-column.items-center.justify-center.f5', [spinner(5), h('', 'Loading Objects')]),
        Success: () => {
          const searchInput = object?.searchInput?.trim() ?? '';
          if (searchInput !== '') {
            const objectsLoaded = object.list;
            const objectsToDisplay = objectsLoaded.filter((qcObject) =>
              qcObject.name.toLowerCase().includes(searchInput.toLowerCase()));
            return virtualTable(model, 'main', objectsToDisplay);
          }
          return ObjectTreeComponent(object.tree, branchItem, (leafObject) => leafItem(leafObject, object));
        },
        Failure: () => null, // Notification is displayed
      })),
      selected && h(`.animate-width.scroll-y${treeWidthClass}`, objectPanel(model)),
    ]),
    h('.f6.status-bar.ph1.flex-row', [
      statusBarLeft(object),
      statusBarRight(object),
    ]),
  ]);
};
