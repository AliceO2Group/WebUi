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

const BKP_PAGE = 'log-create';
const BKP_TEMPLATE_KEY = 'on-call';

/**
 * Create link to BKP page for loading a log-entry form with pre-filled values
 * @param {object} logItem - attributes needed to build the URL
 * @param {Model} model - Root model of the application
 * @returns {Component} - built URL for redirecting the user to the BKP entry form
 */
export const getBkpLogEntryFormUrl = (logItem, model) => {
  const { configuration } = model.configurationService;
  if (!configuration.isSuccess()) {
    return '';
  }

  let bkpPreparedUrl = configuration.payload?.bookkeeping.url;
  if (!bkpPreparedUrl) {
    return '';
  }

  const bkpUrlParameters = {
    page: BKP_PAGE,
    templateKey: BKP_TEMPLATE_KEY,
    ...logItem.run && { runNumbers: [logItem.run] },
    ...logItem.message && { issueDescription: logItem.message },
    ...logItem.partition && { environmentIds: logItem.partition },
    ...(logItem.detector || logItem.system) && { detectorOrSubsystem: logItem.detector ?? logItem.system },
  };

  let firstParameter = true;
  for (const [key, value] of Object.entries(bkpUrlParameters)) {
    if (value != null) {
      if (firstParameter) {
        bkpPreparedUrl += `/?${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        firstParameter = false;
      } else {
        bkpPreparedUrl += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
    }
  }
  return bkpPreparedUrl;
};
