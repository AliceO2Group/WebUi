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
      checked = _isUserLogicEnabledForDetector(model, componentId);
      onchange = () => _toggleUserLogicByDetector(model, componentId);
      break;
    case 'host':
      checked = _isUserLogicEnabledForHost(model, componentId);
      onchange = () => _toggleUserLogicByHost(model, componentId);
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
    h('label.f6.ph2', {
      for: id,
      style: `font-weight: bold; margin-bottom:0;cursor:pointer`,
      title: `Toggle selection of UserLogic for ${componentId}`
    }, 'User Logic'),
  ]);
};

/**
 * Add a checkbox for the user to enable/disable the user logic for a serial:endpoint cru card
 * @param {Object} model
 * @param {JSON} cru
 * @returns {vnode}
 */
const userLogicCheckBoxForEndpoint = (model, cru, width) =>
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
    }, 'User Logic')
  ]);

/**
 * Given a string detector, check if UserLogic is enabled for all hosts CRUs serial:endpoint for that detector
 * @param {Object} model
 * @param {String} detector
 * @returns {boolean}
 */
const _isUserLogicEnabledForDetector = (model, detector) => {
  try {
    const hostsWithCru = model.configuration._getHostsWithCRUForDetector(detector);
    return hostsWithCru.every((host) => _isUserLogicEnabledForHost(model, host))
  } catch (error) {
    console.error(error);
  }
  return false;
}


/**
 * Given a string host, check if UserLogic is enabled for all CRUs serial:endpoint for that host
 * @param {Object} model
 * @param {String} host
 * @returns {boolean}
 */
const _isUserLogicEnabledForHost = (model, host) => {
  const config = model.configuration;
  try {
    return Object.keys(config.cruMapByHost.payload[host]).every((cru) => {
      return config.cruMapByHost.payload[host][cru].config.cru.userLogicEnabled === 'true';
    });
  } catch (error) {
    console.error(error);
  }
  return false;
}

/**
 * Given a string detector, toggle the userLogic for all of its hosts CRUs serial:endpoint for that detector
 * @param {String} detector
 */
const _toggleUserLogicByDetector = (model, detector) => {
  const config = model.configuration;
  try {
    const hostsWithCru = config._getHostsWithCRUForDetector(detector);
    const value = _isUserLogicEnabledForDetector(model, detector) ? 'false' : 'true';
    hostsWithCru.forEach((host) => _toggleUserLogicByHost(model, host, value));
  } catch (error) {
    console.error(error);
  }
  config.notify();
}


/**
 * Given a string host, toggle the userLogic for all of its CRUs serial:endpoint
 * @param {String} host
 * @param {String} value - value that should be set for the whole set. If undefined, method will decide based on existing selection
 */
const _toggleUserLogicByHost = (model, host, value = undefined) => {
  const config = model.configuration;
  try {
    if (!value) {
      value = _isUserLogicEnabledForHost(model, host) ? 'false' : 'true';
    }
    Object.keys(config.cruMapByHost.payload[host])
      .forEach((cru) => config.cruMapByHost.payload[host][cru].config.cru.userLogicEnabled = value);
  } catch (error) {
    console.error(error);
  }
  config.notify();
}

export {userLogicCheckBox, userLogicCheckBoxForEndpoint};
