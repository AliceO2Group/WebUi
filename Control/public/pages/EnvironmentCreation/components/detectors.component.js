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
import {h, iconCircleX} from '/js/src/index.js';
import loading from './../../../common/loading.js';

/**
 * Builds a component with all detectors and actions allowed on them
 *
 * @param {DetectorsModel} detectorsModel -  the EOS report creation model
 * @return {vnode}
 */
export const detectorsComponent = (detectors) => {
  return h('.w-100.flex-column', [
    detectors.match({
      NotAsked: () => null,
      Loading: () => h('.w-100.text-center', loading(2)),
      Success: (detectorList) => h('.grid.g2', detectorList.map((detector) => detectorComponent(detector))),
      Failure: (_) => h('.w-100.text-center.danger', [
        iconCircleX(), ' Unable to load list of detectors.'
      ])
    })
  ]);
};
