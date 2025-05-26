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

import { h, iconX } from '/js/src/index.js';
import { parseOdcStatusPerEnv } from './../utils.js';

/**
 * Return an object with the current status (vnode) and style to display with regards to an environment being ready to be started
 * An environment is considered ready if:
 * * EPN is enabled:
 * * * an environment is considered READY (to be started) if ODC status is READY and such a text will be displayed
 * * DCS is enabled:
 * * * is SOR ready for all detectors
 * * ECS finished transitioning and is CONFIGURED
 * @param {EnvironmentInfo} item - Environment to be checked
 * @param {Model} model - Model to be used
 * @returns {{statusComponent: {vnode, string}, styleClasses: string, statusMessage: string|undefined}}
 */
export const environmentReadinessStatus = (item, model) => {
  const {currentRunNumber, currentTransition, state, userVars} = item;
  let classes = '';
  let statusComponent = '-';
  let statusMessage = undefined;

  if (state === 'CONFIGURED' && !currentTransition) {
    statusComponent = 'READY';
    statusMessage = undefined;
    classes = 'bg-primary white';

    // If ECS is not performing any transitions, we check critical services to be also done (ODC, DCS)
    const isEpnEnabled = userVars?.['epn_enabled'] === 'true';
    if (isEpnEnabled) {
      const { state: odcState } = parseOdcStatusPerEnv(item);
      if (odcState !== 'READY' && state === 'CONFIGURED') {
        statusComponent = 'ODC...';
        statusMessage = 'ODC is not in READY state';
      }
    }

    const isDcsOn = userVars?.['dcs_enabled'] === 'true';
    if (isDcsOn) {
      const { includedDetectors } = item;
      const isSorAvailable = model.services.detectors.areDetectorsAvailable(includedDetectors, 'sorAvailability');
      if (!isSorAvailable) {
        statusComponent = () => h('.g2', [iconX(), 'SOR']);
        statusMessage = 'SOR is not available for one or more of the included detectors';
        classes = 'danger';
      }
    }
  }

  if (currentTransition) {
    classes = '';
    statusComponent = '...';
    statusMessage = undefined;
  }

  // If a runNumber is available, it will be displayed
  if (currentRunNumber) {
    classes = 'bg-success white';
    statusComponent = currentRunNumber;
    statusMessage = undefined;
  }

  return {
    statusComponent: typeof statusComponent === 'string' ? () => h('', statusComponent) : statusComponent,
    statusMessage,
    styleClasses: classes
  };
}
