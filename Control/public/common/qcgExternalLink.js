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

import {h, iconExternalLink} from '/js/src/index.js';

/* global COG */

/**
 * Component for building an external link in a new tab to QCG component based on a given run object
 * @param {Run} run - object with run information needed for building a link
 * @return {vnode}
 */
export const qcgExternalLink = (run) => {
  const {runNumber, detectors, definition, runType} = run;

  const qcgLinkQueryParameters = ['page=layoutShow'];
  if (definition) {
    qcgLinkQueryParameters.push(`definition=${definition}`);
  }
  if (runType) {
    qcgLinkQueryParameters.push(`runType=${runType}`);
  }
  if (detectors?.length === 1) {
    qcgLinkQueryParameters.push(`detector=${detectors[0]}`);
  }
  if (runNumber) {
    qcgLinkQueryParameters.push(`runNumber=${runNumber}`);
  }
  const qcgRedirectLink = `${COG.QCG_URL}?${qcgLinkQueryParameters.join('&')}`;

  if (COG.QCG_URL) {
    return h('a.f5', {
      href: qcgRedirectLink,
      target: '_blank',
    }, h('.flex-row.gc1', [
      'QCG',
      h('span.f6', iconExternalLink()),
    ])
    );
  }
  return;
}
