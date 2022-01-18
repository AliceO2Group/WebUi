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
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import {detectorHeader} from '../common/detectorHeader.js';

/**
 * @file Page to Hardware (content and header)
 */

/**
 * Header of the hardware page
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'FLPs by Detector')),
  h('.flex-grow text-right', [])
];

/**
 * Content of the hardware page
 * Displays a list of FLPs grouped by their detector
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.flex-column', [
  detectorHeader(model),
  h('.scroll-y.absolute-fill.p2', {style: 'top: 40px'},
    model.detectors.hostsByDetectorRemote.match({
      NotAsked: () => null,
      Loading: () => pageLoading(),
      Success: (data) => detectorPanels(model, data),
      Failure: (error) => errorPage(error),
    })
  )
]);

/**
 * Build a list of panels per detector with hosts
 * @param {Object} model
 * @param {Map<String, JSON} detectors
 * @returns {vnode}
 */
const detectorPanels = (model, detectors) => [
  Object.keys(detectors)
    .sort()
    .filter((detector) => (detector === model.detectors.selected || model.detectors.selected === 'GLOBAL'))
    .map((detector) => {
      const flps = detectors[detector];
      return h('.w-100', [
        h('.panel-title.flex-row.p2', [
          h('h4.w-20', `${detector} (${flps.length})`),
        ]),
        h('.panel.w-100.flex-row',{
          style: 'flex-wrap: wrap'
        }, [
          flps.map((flp) => h('label.ph2.w-25', flp))
        ])
      ])
    })
];
