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

import { formatTimeDuration } from '/js/src/index.js';
import { rowForCard } from '../../../common/card/rowForCard.js';
import { miniCard } from './../../../common/card/miniCard.js';
import { calibrationRunCardHeader } from './calibrationRunCardHeader.js';
import { qcgExternalLink } from './../../../common/qcgExternalLink.js';

/**
 * Builds a card with information specific to a calibration run.
 * @param {RunSummary} run - information about the run
 * @returns {vnode}
 */
export const calibrationRunCard = (run) => !run ?
  null
  : miniCard(calibrationRunCardHeader(run), [
    rowForCard(formatTimeDuration(run.runDuration), `Start: ${new Date(run.startTime).toLocaleString()}`),
    rowForCard(qcgExternalLink(run), `End: ${new Date(run.endTime).toLocaleString()}`),
  ], ['w-30', 'g0', 'p2']);
