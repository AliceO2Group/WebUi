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
 * Render a run mode switch
 * @param {number} runNumber - The run number
 * @param {RunStatus} status - The run status
 * @param lastRefreshed
 * @returns {HTMLElement} - The rendered run status panel
 */
export const runStatusPanel = ({ runNumber, runStatus, lastRefresh, refreshRate }) => {
  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  const el = document.getElementById('lastUpdate');
  if (el) {
    el.classList.remove('highlight');
    void el.offsetWidth;
    el.classList.add('highlight');
  }

  return runStatus.match({
    Loading: () =>
      h('div.flex-row.g1.items-center.justify-center', [
        h('b', `Run #${runNumber}`),
        h('div.flex-row.g1', [
          h('div.label', 'Status: '),
          h('b.color-gray', 'Loading...'),
        ]),
      ]),

    Success: (res) => {
      const formattedDate = formatDateTime(lastRefresh);
      const timestampEl = h(
        'span.f7.gray-darker.text-center',
        { id: 'lastUpdate' },
        `Last update: ${formattedDate} ${res?.runStatus === RunStatus.ONGOING
          ? `- As run is ONGOING, will refresh every ${refreshRate / 1000} seconds`
          : ''}`,
      );
      const runStatus = res?.runStatus;
      const shouldShowTimestamp = runStatus === RunStatus.ONGOING || runStatus === RunStatus.ENDED;
      return h('div.flex-column', [
        h('div.flex-row.g1.items-center.justify-center', { id: 'runStatusPanel' }, [
          h('span', { id: 'runNumber' }, [
            'Run ',
            h('b', `#${runNumber}`),
          ]),
          h('div.flex-row.g1', [
            h('span', '| Status: '),
            h(
              `b.${res?.runStatus === RunStatus.ONGOING ? 'success' : 'gray-darker'}`,
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
