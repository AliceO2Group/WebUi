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

/* global COG */

import {h} from '/js/src/index.js';
import {iframe} from '../../../common/iframe/iframe.js';

/**
 * Build a panel with iframe components to display monitoring plots for the environment if grafana is configured
 * @param {EnvironmentInfo} environment - DTO representing an environment
 * @returns {vnode}
 */
export const monitoringRunningPlotsPanel = ({currentRunNumber, userVars}) => {
  const isMonitoringConfigured = COG?.GRAFANA?.status;
  const {readoutPlot, flpStats, epnStats} = COG && COG.GRAFANA && COG.GRAFANA.plots;
  const runStart = Number(userVars['run_start_time_ms']);
  let readoutMonitoringSource = '';
  let flpMonitoringSource = '';
  let epnMonitoringSource = '';

  if (isMonitoringConfigured) {
    const THIRTY_MINUTES_IN_MS = 1000 * 60 * 30;
    const runStartParam = (Number.isInteger(runStart) && (Date.now() - runStart) < THIRTY_MINUTES_IN_MS)
      ? `&from=${runStart}&to=now`
      : '';
    readoutMonitoringSource = readoutPlot + '&var-run=' + currentRunNumber + runStartParam;
    flpMonitoringSource = flpStats + '&var-run=' + currentRunNumber;
    epnMonitoringSource = epnStats + '&var-run=' + currentRunNumber;
    return h('.flex-column.w-100.g2', [
      iframe(readoutMonitoringSource, 'height: 12em; border: 0; width:100%'),
      h('.flex-row.g2', [
        iframe(flpMonitoringSource, 'height: 12em; border: 0; width:50%'),
        iframe(epnMonitoringSource, 'height: 12em; border: 0; width:50%')
      ])
    ]);
  } else {
    return h('.w-100.text-center.grafana-font', 'Grafana plots were not configured, please contact an administrator');
  }
};
