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
import { di } from '../../../utilities/di.js';
import { isUserAllowedRole } from '../../../common/userRole.js';
import { ROLES } from '../../../workflow/constants.js';

/**
 * Button to acknowledge a failed deployment and remove it from the cache
 * The button is only visible to users with Admin role or the person who attempted the deployment
 * @param {string} environmentId - ID of the failed deployment (environment) to acknowledge
 * @param {{externalId: number, name: string}} user - ID of the person who attempted the deployment
 * @param {Function} acknowledgeCallback - Callback function to call when the button is clicked
 * @return {vnode} - Virtual node representing the button
 */
export const buttonToAcknowledgeDeployment = (environmentId, user, acknowledgeCallback) => {
  if (isUserAllowedRole(ROLES.Admin) || di.session.personid === user?.externalId) {
    return h('button.btn.btn-danger', {
      title: 'Acknowledge failed deployment and remove it from the cache',
      onclick: () => acknowledgeCallback(environmentId)
    }, 'Acknowledge');
  }
};
