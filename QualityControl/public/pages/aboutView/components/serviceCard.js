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

/**
 * Builds a card for an integrated service
 * @param serviceData - JSON with information about the service such as name, status, etc.
 * @returns {vnode}
 */
export const serviceCard = (serviceData) => {
  const { name, status, version, extras = {} } = serviceData || {};
  const { ok, message = null } = status || {};
  const isDown = !ok;
  const showExtras = Object.keys(extras).length > 0;
  const extrasToDisplay = JSON.parse(JSON.stringify(extras));
  const titleClass = ok ? '' : 'bg-danger white';
  return h('.w-33.flex-column', { id: name }, [
    h('.panel-title.p2.flex-row', { class: titleClass }, [
      h('h4', name),
      version && h('i.text-right.flex-grow', { style: 'justify-content: flex-end' }, version),
    ]),
    h('.panel.flex-column.g2', [
      isDown && serviceRow('Error', message),
      showExtras &&
      h(
        '.flex-column.g2',
        Object.entries(extrasToDisplay).map(([key, value]) =>
          h('.flex-row', {
            style: 'background-color: #f8f9fa; padding: 5px; border-radius: 4px;',
          }, [
            h('div', { style: 'flex: 1; text-align: left;' }, h('strong', key.charAt(0).toUpperCase() + key.slice(1))),
            h('div', { style: 'flex: 1; text-align: left;' }, value.toString()),
          ])),
      ),

    ]),
  ]);
};

const serviceRow = (name, value) => value && h('.w-100.flex-row', [
  h('h6.w-40.p1', name),
  h('span.w-60.ph1', value),
]);
