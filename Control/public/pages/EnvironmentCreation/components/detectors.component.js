/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

import {detectorComponent} from './detector.component.js';
import {h} from '/js/src/index.js';

const detectors = [
  'CPV', 'EMC', 'FDD', 'Ft0', 'FV0', 'HMP', 'ITS', 'MCH', 'MFT', 'MID', 'PHS', 'TOF', 'TPC', 'TRD', 'TST', 'ZDC'
];

/**
 * Builds a component with all detectors and actions allowed on them
 *
 * @param {DetectorsModel} detectorsModel -  the EOS report creation model
 * @return {vnode}
 */
export const detectorsComponent = () => {
  return h('.w-100.flex-column', [
    h('h5.bg-gray-light.p2.panel-title.w-100', 'Select Detectors'),
    h('.flex-row.flex-wrap', detectors.map((detector) => detectorComponent(detector)))
  ]);
};
