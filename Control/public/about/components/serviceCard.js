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
import {serviceRow as itemRow} from './serviceRow.js';

/**
 * Builds a panel corresponding to the information of Service in AliECS GUI
 * @param {object} service - JSON with information about the service such as name, status, etc.
 * @returns {vnode}
 */
export const serviceCard = (service, showExtras = false) => {
  const {
    status: {ok, configured, message} = {}, endpoint, version, extras, name = 'UNDEFINED', connectionState
  } = service;
  const isDown = configured && !ok;
  showExtras = showExtras && extras && Object.keys(extras).length > 0;

  const titleClass = (configured && ok) ? 'success' : (configured && !ok) ? 'bg-danger white' : '';

  return h('.w-33.flex-column', {id: name}, [
    h('.panel-title.p2.flex-row', {class: titleClass}, [
      h('h4', name),
      version && h('i.text-right.flex-grow', {style: 'justify-content: flex-end'}, version)
    ]),
    configured && h('.panel.flex-column.g2', [
      [
        isDown && itemRow('Error', message),
        itemRow('Endpoint', endpoint),
        itemRow('Connection State', connectionState),
        showExtras && h('pre', {style: 'max-height: 10em'}, JSON.stringify(extras, null, 2))
      ]
    ])
  ]);
};
