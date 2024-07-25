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
import { di } from './../../../utilities/di.js';
import { ROLES } from '../../../workflow/constants.js';

const MINIUM_ROLE_REQUIRED = ROLES.Global;

/**
 * Builds a component that contains a button which allows refresh of the configurations stored for calibrations page
 * The user should be authenticated as minimum ROLES.Global
 * @param {Function} onclick - action to take when button is pressed
 * @returns {vnode}
 */
export const calibrationRefreshContentButton = (onclick) => {
  const isAllowed = di.session.role <= MINIUM_ROLE_REQUIRED;
  return !isAllowed ?
    null :
    h(
      '.flex-row.flex-end.p2',
      h('button.btn.btn-sm.btn-default', {
        onclick,
        title: 'Request an update of the calibration runs CONFIGURATION',
      }, 'Refresh Calibration Configurations'),
    );
};
