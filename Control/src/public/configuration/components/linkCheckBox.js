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
 * @file which contains multiple reuseable components for the configuration page
 */

/**
 * Generate a checkbox based on title and field to change
 * @param {Object} model
 * @param {string} key - format link0
 * @param {JSON} config - reference to the configuration in CRUsMapByHost
 * @param {string} label - name of link
 * @return {vnode}
 */
const cruLinkCheckBox = (model, key, config, label) => {
  return h('label.d-inline.f6.ph2', {
    style: 'white-space: nowrap',
    title: `Toggle selection of ${key}`
  }, h('input', {
    type: 'checkbox',
    checked: config[key].enabled === 'true',
    onchange: () => {
      config[key].enabled = config[key].enabled !== 'true' ? 'true' : 'false';
      model.configuration.notify();
    }
  }), label);
};

export {cruLinkCheckBox};
