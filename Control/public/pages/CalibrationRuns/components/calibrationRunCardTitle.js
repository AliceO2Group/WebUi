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
import {coloredCell} from './../../../common/coloredCell.js';
import {RUN_CALIBRATION_STATUS_COLOR_MAP} from './../../../common/enums/runCalibrationStatus.enum.js';

/* global COG */

/**
 * Component for building the title component of a calibrationRunCard
 * @return {vnode}
 */
export const calibrationRunCardTitle = (run) =>
  h('.flex-row.justify-between', [
    h('.flex-row.w-60', [
      h('a.f4.actionable-row', {
        href: `${COG.BKP_URL}?page=run-detail&id=${run.id}`,
        target: '_blank',
      }, run.runNumber),
      h('.f4.ph2', '/'),
      h('a.f4.text-right.actionable-row', {
        href: `${COG.BKP_URL}?page=env-details&environmentId=${run.environmentId}`,
        target: '_blank',
      }, run.environmentId)
    ]),
    coloredCell(run.calibrationStatus, RUN_CALIBRATION_STATUS_COLOR_MAP),
  ]);
