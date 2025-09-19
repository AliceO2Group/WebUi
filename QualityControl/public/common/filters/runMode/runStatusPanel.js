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

import { h } from '/js/src/index.js';

/**
 * Render a run mode switch
 * @param {number} runNumber - The run number
 * @param {RunStatus} status - The run status
 * @returns {HTMLElement} - The rendered run status panel
 */
export const runStatusPanel = (runNumber, status) =>
  status.match({
    Loading: () =>
      h('.flex-row.g1.items-center.justify-center', [
        h('b', { id: 'runNumberLabel' }, `#${runNumber}`),
        h('.flex-row.g1', [
          h('label', 'Status: '),
          h('b.color-gray', 'Loading...'),
        ]),
      ]),

    Success: (res) =>
      h('.flex-row.g1.items-center.justify-center', { id: 'runStatusPanel' }, [
        h('b', { id: 'runNumberLabel' }, `#${runNumber}`),
        h('.flex-row.g1', [
          h('span', 'Status: '),
          h(
            `b.${
              res?.runStatus === 'ONGOING' ? 'success' : 'gray'
            }`,
            {
              id: 'runStatus',
            },
            res?.runStatus,
          ),
        ]),
      ]),
    Other: () => null,
  });
