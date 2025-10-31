/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { RunStatus } from '../../../../../library/runStatus.enum.js';
import { h } from '/js/src/index.js';

/**
 * Creates and returns a run status panel element displaying the current run number,
 * its status, the last refresh timestamp, and the refresh rate.
 * @param {string} runStatus The status of the run (e.g., "running", "completed").
 * @returns {vnode} The element representing the run status panel.
 */
export const runStatusPanel = (runStatus) =>
  runStatus && h(
    '.flex-row.g1.items-center.justify-center',
    { id: 'runStatusPanel' },
    [
      h(
        `.badge.white.bg-${runStatus === RunStatus.ONGOING ? 'success' : 'gray-darker'}`,
        { id: 'runStatusBadge' },
        runStatus,
      ),
    ],
  );

export const lastUpdatePanel = (runStatus, lastRefresh, refreshRate = 15000) => {
  const shouldShowTimestamp = runStatus === RunStatus.ONGOING || runStatus === RunStatus.ENDED;

  const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss

  return shouldShowTimestamp && h('.flex-row.g1.items-center.justify-center.f7.gray-darker.text-center', [
    h(
      'span',
      { id: 'lastUpdate' },
      `Last update: ${formatDateTime(lastRefresh)}`,
    ),
    runStatus === RunStatus.ONGOING &&
      h(
        'span',
        { id: 'refreshInfo' },
        ` - As run is ONGOING, will refresh every ${refreshRate / 1000} seconds`,
      ),
  ]);
};
