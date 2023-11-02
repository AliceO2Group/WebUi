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

import {h, iconPlayCircle} from '/js/src/index.js';
import {miniCard} from './../../../common/card/miniCard.js';
import pageLoading from './../../../common/pageLoading.js';
import errorComponent from './../../../common/errorComponent.js';

/**
 * Builds a card with information and actions allowed on that type of run calibration for that detector
 * @param {CalibrationConfiguration} calibrationConfiguration - information about the run
 * @param {RemoteData<RunSummary.Error>} ongoingCalibrationRun - information on ongoing calibration run
 * @param {String} detector - to which the run belongs to
 * @param {Function} onclick - action to trigger when clicking on button
 * @return {vnode}
 */
export const calibrationActionCard = (calibrationConfiguration, ongoingCalibrationRun, detector, onclick) => {
  const {runType, configuration, label} = calibrationConfiguration;
  return miniCard(
    h('.flex-row.justify-between', [
      h('.flex-row.gc1', [
        h('button.btn.btn-sm.btn-success', {
          onclick: () => onclick(detector, runType, configuration),
          title: `Start a calibration run for ${detector} with run type ${runType}`,
        }, iconPlayCircle()),
        h('strong', label),
      ]),
      h('small', `${configuration}`)
    ]), [
      ongoingCalibrationRun && ongoingCalibrationRun.match({
        NotAsked: () => null,
        Loading: () => pageLoading(1),
        Success: (result) => h('', result),
        Failure: (error) => errorComponent(error),
      })
    ], ['w-50', 'g0', 'gr1', 'p1']
  );
};
