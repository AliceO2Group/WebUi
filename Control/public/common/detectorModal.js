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

import {h, iconCircleX} from '/js/src/index.js';
import loading from './loading.js';

/**
 * Component which will display a modal allowing the users to select their detector view
 * No matter the page location, modal will be displayed if user did not make a selection
 * @param {Object} model
 * @return {vnode}
 */
const detectorsModal = (model) =>
  !model.detectors.selected && model.isAllowed(model.Roles.Detector) && h('.o2-modal',
    h('.o2-modal-content', [
      h('.p2.text-center', [
        h('h4', 'Select your detector view'),
        h('label', {style: 'font-style: italic;'}, 'Displayed data will be filtered based on your selection')
      ]),
      h('.w-100.flex-row', {style: 'flex-wrap: wrap; justify-content:center'}, [
        model.detectors.listRemote.match({
          NotAsked: () => null,
          Loading: () => h('.w-100.text-center', loading(2)),
          Success: (data) => detectorsList(model, model.isAllowed('global') ?
            data : data.filter((det) => model.detectors.authed.includes(det))),
          Failure: (_) => h('.w-100.text-center.danger', [
            iconCircleX(), ' Unable to load list of detectors.'
          ])
        })
      ]),
      h('.w-100.pv3.f3.flex-row', {style: 'justify-content:center;'},
        h('.w-50.flex-column.dropdown#flp_selection_info_icon', [
          model.isAllowed(model.Roles.Global) &&
            h(`button.btn.btn-default.w-100`, {
              id: `GLOBALViewButton`,
              onclick: () => model.setDetectorView('GLOBAL'),
            }, 'GLOBAL')
        ])
      )
    ])
  );

/**
 * Build a wrapped list of detector buttons
 * @param {Object} model
 * @param {List<String>} list
 * @returns {vnode}
 */
const detectorsList = (model, list) =>
  list.map((detector) => h('.w-25.pv3.text-center.f3',
    h('button.btn.btn-default.w-70', {
      id: `${detector}ViewButton`,
      onclick: () => model.setDetectorView(detector)
    }, detector)
  ));

export {detectorsModal};
