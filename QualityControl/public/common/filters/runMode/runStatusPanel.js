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
import { spinner } from '../../spinner.js';
import { h } from '/js/src/index.js';

/**
 * Creates and returns a run status panel element displaying the current run number,
 * its status, the last refresh timestamp, and the refresh rate.
 * @param {object} options Options for rendering the run status panel.
 * @param {number} options.runNumber The current run number to display.
 * @param {string} options.runStatus The status of the run (e.g., "running", "completed").
 * @param {Date} options.lastRefresh Timestamp of the last refresh.
 * @param {number} options.refreshRate - Refresh rate in milliseconds.
 * @returns {vnode} The element representing the run status panel.
 */
export const runStatusPanel = ({ runNumber, runStatus, lastRefresh, refreshRate = 15000 }) => {
  const runNumberPanel = h('span', { id: 'runNumberLabel' }, [
    'Run ',
    h('b', `#${runNumber}`),
  ]);
  const statusPanel = (runStatus) =>
    runStatus
      ? h(
        `.badge.white.bg-${runStatus === RunStatus.ONGOING ? 'success' : 'gray-darker'}`,
        { id: 'runStatusBadge' },
        runStatus,
      )
      : h('span', spinner(1));
  const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss

  const lastUpdatePanel = (runStatus) => [
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
  ];
  const shouldShowTimestamp = runStatus === RunStatus.ONGOING || runStatus === RunStatus.ENDED;

  return runNumber && runStatus && h('.flex-column', [
    h('.flex-row.g1.items-center.justify-center', { id: 'runStatusPanel' }, [
      runNumberPanel,
      statusPanel(runStatus),
    ]),
    shouldShowTimestamp && h(
      '.flex-row.g1.items-center.justify-center.f7.gray-darker.text-center',
      lastUpdatePanel(runStatus),
    ),
  ]);
};
