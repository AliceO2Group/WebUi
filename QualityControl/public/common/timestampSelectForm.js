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

/**
 * Display a select form with the latest timestamps of the current selected object
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.w-100.flex-row',
  model.object.selected && model.object.objects && model.object.objects[model.object.selected.name]
  && model.object.objects[model.object.selected.name].kind === 'Success' &&
  h('select.form-control.gray-darker.text-center.w-25', {
    onchange: (e) => {
      const value = e.target.value;
      if (value !== 'Invalid Timestamp') {
        model.object.loadObjectByName(model.object.selected.name, value);
      }
    }
  }, [
    model.object.getObjectTimestamps(model.object.selected.name)
      .map((timestamp) => {
        return h('option.text-center', {
          value: timestamp,
          selected: timestamp === model.object.selected.version ? true : false
        }, [
          model.object.getDateFromTimestamp(timestamp),
          ' (',
          timestamp,
          ')'
        ]);
      })
  ])
);
