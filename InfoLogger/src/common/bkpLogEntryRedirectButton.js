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
import { getBkpLogEntryFormUrl } from '../services/externalRouting/getBkpLogEntryFormUrl.js';

/**
 * Button element that will link to a pre-filled Bookkeeping entry.
 * @param {Log} logItem - Log item to be used to fill the form.
 * @param {Model} model - Root model of the application
 * @returns {vnode} - button element built to redirect user to BKP application
 */
export const bkpLogEntryRedirectButton = (logItem, model) => {
  const bkpUrl = getBkpLogEntryFormUrl(logItem, model);

  return h(`a.btn.btn-sm${!bkpUrl ? '.disabled' : ''}`, {
    href: bkpUrl,
    disabled: Boolean(!bkpUrl),
    title: bkpUrl ? 'Open BKP log entry form' : 'Service Not Available',
    target: '_blank',
  }, 'New BKP log');
};
