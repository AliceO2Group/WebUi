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
 * @file Page which contains multiple reuseable components for the configuration page
 */

/**
 * User Logic Checkbox with corresponding label
 * It supports 3 types: detector, host
 * @param {Object} model
 * @param {String} componentId - refers to the component(detector/host) name
 * @param {String} type - refers to the component being used for detector or host panels
 * @param {String} width - expects a class with regards to width (e.g .w-50)
 * @return {vnode}
 */
const userLogicCheckBox = (model, componentId, type, width) => {
  const id = componentId + type + 'Checkbox';
  let checked = false;
  let onchange = undefined;
  switch (type) {
    case 'detector':
      checked = model.configuration.isUserLogicEnabledForDetector(componentId);
      onchange = () => model.configuration.toggleUserLogicByDetector(componentId);
      break;
    case 'host':
      checked = model.configuration.isUserLogicEnabledForHost(componentId);
      onchange = () => model.configuration.toggleUserLogicByHost(componentId);
      break;
  }
  return h(`${width}.flex-row`, {
    style: 'display: flex; align-items: center;'
  }, [
    h('input', {
      type: 'checkbox',
      style: 'cursor: pointer',
      id,
      checked,
      onchange,
    }),
    h('label.f6.ph2.w-20', {
      for: id,
      style: `font-weight: bold; margin-bottom:0;cursor:pointer`,
      title: `Toggle selection of UserLogic for ${componentId}`
    }, 'User Logic'),
  ])
};

/**
 * Add a checkbox for the user to enable/disable the user logic for a serial:endpoint cru card
 * @param {Object} model
 * @param {JSON} cru
 * @returns {vnode}
 */
const userLogicCheckboxForEndpoint = (model, cru, width) =>
  h(`${width}.flex-row`, {
    style: 'display: flex; align-items: center;'
  }, [
    h('input', {
      id: `${cru.info.serial}-${cru.info.endpoint}-checkbox`,
      type: 'checkbox',
      style: 'cursor: pointer',
      checked: cru.config.cru.userLogicEnabled === 'true',
      onchange: () => {
        cru.config.cru.userLogicEnabled = cru.config.cru.userLogicEnabled === 'true' ? 'false' : 'true';
        model.configuration.notify();
      }
    }),
    h('label.f6.ph2', {
      for: `${cru.info.serial}-${cru.info.endpoint}-checkbox`,
      style: `font-weight: bold; margin-bottom:0;cursor:pointer`,
      title: `Toggle selection of User Logic`
    }, ' User Logic')
  ]);


export {userLogicCheckBox, userLogicCheckboxForEndpoint};
