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

import {h, iconPencil} from '/js/src/index.js';

/**
 * Component which will display selected detectors to filter data based on
 * To be used in most of the pages to display the selection
 * @param {Object} model
 * @return {vnode}
 */
const detectorHeader = (model) => {
  const selected = model.detectors.selected;
  if (selected) {
    return h('.w-100.bg-gray-light.pv2', {
      style: 'height: 40px'
    },[
      h('h4.f5.flex-row', {style: 'justify-content: center;'},
        h('.ph2', `Detector View: ${selected}`),
        h('a.f6.actionable-icon', {
          onclick: () => model.resetDetectorView('')
        }, [iconPencil()])
      )
    ])
  }
};

export {detectorHeader};
