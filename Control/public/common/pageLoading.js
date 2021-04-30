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

import {h} from '/js/src/index.js';

/**
 * Generic page loading placeholder
 * @param {number} size
 * @return {vnode}
 */
export default (size = 10, margin = '2em') =>
  h('span.pageLoading',
    {
      style: `font-size: ${size}em;margin:${margin}`
    },
    h('.atom-spinner',
      h('.spinner-inner',
        [
          h('.spinner-line'),
          h('.spinner-line'),
          h('.spinner-line'),
          h('.spinner-circle',
            h('div', '●')
          )
        ]
      )
    )
  );
