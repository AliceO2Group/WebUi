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
 * @param {object} options Options for rendering the run status panel.
 * @param {number} options.runNumber The current run number to display.
 * @param {string} options.runStatus The status of the run (e.g., "running", "completed").
 * @param {Date} options.lastRefresh Timestamp of the last refresh.
 * @param {number} options.refreshRate - Refresh rate in milliseconds.
 * @returns {vnode} The element representing the run status panel.
 */
export const runStatusPanel = ({ runNumber, runStatus, lastRefresh, refreshRate = 15000 }) => {
  const formatDateTime = (dateStr) =>
    new Date(dateStr).toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss

  const formattedDate = formatDateTime(lastRefresh);

  return runStatus.match({
    Loading: () =>
      h('div.flex-row.g1.items-center.justify-center', [
        h('b', { id: 'runNumberLabel' }, `#${runNumber}`),
        h('div.flex-row.g1', [
          h('div.label', 'Status: '),
          h('b.color-gray', 'Loading...'),
        ]),
      ]),

    Success: (res) => {
      const timestampEl = h(
        'span.f7.gray-darker.text-center.highlight',
        { id: 'lastUpdate' },
        `Last update: ${formattedDate} ${res?.runStatus === RunStatus.ONGOING
          ? `- As run is ONGOING, will refresh every ${refreshRate / 1000} seconds`
          : ''}`,
      );
      const runStatus = res?.runStatus;
      const shouldShowTimestamp = runStatus === RunStatus.ONGOING || runStatus === RunStatus.ENDED;
      return h('div.flex-column', [
        h('div.flex-row.g1.items-center.justify-center', { id: 'runStatusPanel' }, [
          h('span', { id: 'runNumberLabel' }, [
            'Run ',
            h('b', `#${runNumber}`),
          ]),
          h('div.flex-row.g1', [
            h('span', '| Status: '),
            h(
              `b.color-${res?.runStatus === RunStatus.ONGOING ? 'success' : 'gray-darker'}`,
              { id: 'runStatus' },
              res?.runStatus,
            ),
          ]),
        ]),

        // Last update
        shouldShowTimestamp && h(
          'div.flex-row.g1.items-center.justify-center',
          timestampEl,
        ),
      ]);
    },

    NotAsked: () => null,
    Other: () => null,
  });
};
