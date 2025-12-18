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

import { downloadButton } from '../../../common/downloadButton.js';
import { defaultRowAttributes, qcObjectInfoPanel } from './../../../common/object/objectInfoCard.js';
import { h, iconResizeBoth, info } from '/js/src/index.js';

/**
 * Builds 2 actionable buttons which are to be placed on top of a JSROOT plot
 * Buttons shall appear on hover of the plot
 * @param {Model} model - root model of the application
 * @param {object} tabObject - tab dto representation
 * @returns {vnode} - virtual node element
 */
export const objectInfoResizePanel = (model, tabObject) => {
  const { name, id } = tabObject;
  const { filterModel, router, object, services } = model;
  const isSelectedOpen = object.selectedOpenName === id;
  const objectRemoteData = services.object.objectsLoadedMap[name];
  let uri = `?page=objectView&objectId=${tabObject.id}&layoutId=${router.params.layoutId}`;
  Object.entries(filterModel.filterMap)
    .filter(([_, value]) => value)
    .forEach(([key, value]) => {
      uri += `&${key}=${encodeURI(value)}`;
    });
  return h('.text-right.resize-element.item-action-row.flex-row.g1', {
    style: 'visibility: hidden; padding: .25rem .25rem 0rem .25rem;',
  }, [

    h('.dropdown', { class: isSelectedOpen ? 'dropdown-open' : '',
    }, [
      h('button.btn', {
        title: 'View details about histogram',
        onclick: () => object.toggleInfoArea(id),
      }, info()),
      h(
        '.dropdown-menu',
        {
          style: 'right:0.1em; width: 35em;left: auto;',
          oncreate: (vnode) => {
            if (object.isOnLeftSide(vnode.dom.parentElement)) {
              vnode.dom.style.left = '0.1em';
              vnode.dom.style.right = 'auto';
            } else {
              vnode.dom.style.right = '0.1em';
              vnode.dom.style.left = 'auto';
            }
          },
        },
        objectRemoteData.isSuccess() &&
          h('.p1', qcObjectInfoPanel(objectRemoteData.payload, {}, defaultRowAttributes(model.notification))),
      ),
    ]),
    objectRemoteData.isSuccess() &&
    downloadButton({
      href: model.objectViewModel.getDownloadQcdbObjectUrl(objectRemoteData.payload.id),
      title: 'Download object',
      id: `download-button-${objectRemoteData.payload.id}`,
    }),
    h('a.btn', {
      title: 'Open object plot in full screen',
      href: uri,
      onclick: (e) => router.handleLinkEvent(e),
    }, iconResizeBoth()),
  ]);
};
