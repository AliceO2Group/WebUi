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

import {SERVICE_STATES} from './constants/serviceStates.js';
import {h, iconCircleX} from '/js/src/index.js';

/**
 * Component to display an icon with an alert if something goes wrong:
 * - iconCircleX for critical alerts
 * - 
 * @param {number} servicesByCategory
 * @return {vnode}
 */
const alertPanel = (servicesByCategory, model) => {
  let numberOfCriticalErrors = 0;
  for (const service of Object.values(servicesByCategory[SERVICE_STATES.IN_ERROR])) {
    const {status = {}} = service.payload;
    if (status.isCritical && !service.ok) {
      numberOfCriticalErrors++;
    }
  }
  if (numberOfCriticalErrors > 0) {

    return h('a.w-20.mh2.flex-row.flex-end', {
      href: '?page=about',
      onclick: (e) => model.router.handleLinkEvent(e)
    },
    h('.g2.danger.items-center.flex-row.actionable-icon', [
      h('span', iconCircleX()),
      h('h3', `Errors`),
    ])
    )
  }
};

export {alertPanel};
