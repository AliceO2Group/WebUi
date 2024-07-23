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
import { coloredBadge } from '../../../common/coloredBadge.js';
import { RUN_CALIBRATION_STATUS_COLOR_MAP } from '../../../common/enums/runCalibrationStatus.enum.js';

/* global COG */

/**
 * Component for building the title component of a calibrationRunCard
 * @param run
 * @returns {vnode}
 */
export const calibrationRunCardHeader = (run) => {
  const { runNumber, environmentId, calibrationStatus } = run;

  return h('.flex-row.justify-between.f5', [
    h('.flex-row.w-60', [
      h('a.actionable-row', {
        href: `${COG.BKP_URL}?page=run-detail&runNumber=${runNumber}`,
        target: '_blank',
      }, runNumber),
      h('.ph2', '/'),
      h('a.text-right.actionable-row', {
        href: `${COG.BKP_URL}?page=env-details&environmentId=${environmentId}`,
        target: '_blank',
      }, environmentId),
    ]),
    coloredBadge(calibrationStatus, RUN_CALIBRATION_STATUS_COLOR_MAP),
  ]);
};
