
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
import {miniCard} from '../../../common/card/miniCard.js';
import {controlEnvironmentPanel} from './controlEnvironmentPanel.js';
import {ROLES} from '../../../workflow/constants.js';
import {isUserAllowedRole} from '../../../common/userRole.js';

/**
 * Build a panel with multiple mini cards which contain actions allowed to the user for the environment
 * A user should be able to control the environment if:
 * - it is an admin as defined by CERN applications
 * - it is part of the Detector group and has all locks of detectors part of the environment
 * @param {Model} model - root object of the application
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode} - panel with actions allowed for the user to apply on the environment
 */
export const environmentActionPanel = (model, environmentInfo) => {
  const {lock: lockModel, environment: environmentModel} = model;

  const { includedDetectors = [] } = environmentInfo;
  const hasLocks = includedDetectors.every((detector) => lockModel.isLockedByCurrentUser(detector));
  const isAllowedToControl = isUserAllowedRole(ROLES.Detector) && hasLocks;
  
  return miniCard('', controlEnvironmentPanel(environmentModel, environmentInfo, isAllowedToControl));
};
