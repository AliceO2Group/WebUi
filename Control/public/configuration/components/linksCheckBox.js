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
const toggleAllLinksCheckBox = (model, componentId, type, width) => {
  const id = componentId + type + '-checkbox';
  let checked = false;
  let onchange = undefined;
  switch (type) {
    case 'detector':
      checked = _areAllLinksEnabledForDetector(model, componentId);
      onchange = () => _toggleAllLinksByDetector(model, componentId);
      break;
    case 'host':
      checked = _areAllLinksEnabledForHost(model, componentId);
      onchange = () => _toggleAllLinksByHost(model, componentId);
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
      title: `Toggle selection of All Links for ${componentId}`
    }, 'All Links'),
  ]);
};

/**
 * A checkbox which will either select or unselect all checkboxes for links 0 - 11 for a given CRU
 * @param {Object} model
 * @param {JSON} cru - reference to the currently displayed cru
 * @param {Array<String>} linksList
 * @param {String} - width 
 * @return {vnode}
 */
const toggleAllLinksCRUCheckBox = (model, cru, linksList, width) =>
  h(`${width}.flex-row`, {
    style: 'display: flex; align-items: center;'
  }, [
    h('input', {
      id: `${cru.info.serial}-${cru.info.endpoint}-all-checkbox`,
      type: 'checkbox',
      style: 'cursor: pointer',
      checked: linksList.filter((key) => cru.config[key].enabled === 'true').length === linksList.length,
      onchange: () => {
        const areAllChecked = linksList.filter((key) => cru.config[key].enabled === 'true').length === linksList.length;
        linksList.forEach((key) => cru.config[key].enabled = !areAllChecked ? 'true' : 'false');
        model.configuration.notify();
      }
    }),
    h('label.f6.ph2', {
      for: `${cru.info.serial}-${cru.info.endpoint}-all-checkbox`,
      style: `font-weight: bold; margin-bottom:0;cursor:pointer`,
      title: `Toggle selection of all links`
    }, 'All Links')
  ]);


/**
 * Generate a checkbox based on title and field to change
 * @param {Object} model
 * @param {string} key - format link0
 * @param {JSON} config - reference to the configuration in CRUsMapByHost
 * @return {vnode}
 */
const cruLinkCheckBox = (model, key, config) => {
  let id;
  try {
    id = '#' + key.split('link')[1];
  } catch (error) {
    id = key;
  }
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
  }), ' ' + id);
};


/**
 * Given a string detector, check if links[0-11] are all enabled for all hosts and CRUs serial:endpoint for that detector
 * @param {Object} model
 * @param {String} host
 * @returns {boolean}
 */
const _areAllLinksEnabledForDetector = (model, detector) => {
  try {
    const hostsWithCru = model.configuration._getHostsWithCRUForDetector(detector);
    return hostsWithCru.every((host) => _areAllLinksEnabledForHost(model, host))
  } catch (error) {
    console.error(error);
  }
  return false;
}

/**
 * Given a string host, check if links[0-11] are all enabled for all CRUs serial:endpoint for that host
 * @param {String} host
 * @returns {boolean}
 */
const _areAllLinksEnabledForHost = (model, host) => {
  const config = model.configuration;
  try {
    return Object.keys(config.cruMapByHost.payload[host]).every((cru) => {
      return Object.keys(config.cruMapByHost.payload[host][cru].config)
        .filter((key) => key.match('link[0-9]{1,2}')) // select only fields from links0 to links11
        .every((key) => config.cruMapByHost.payload[host][cru].config[key].enabled === 'true');
    });
  } catch (error) {
    console.error(error);
  }
  return false;
}

/**
 * Given a string detector, toggle all links for all of its hosts CRUs serial:endpoint for that detector
 * @param {Object} model
 * @param {String} detector
 */
const _toggleAllLinksByDetector = (model, detector) => {
  const config = model.configuration;
  try {
    const hostsWithCru = config._getHostsWithCRUForDetector(detector);
    const value = _areAllLinksEnabledForDetector(model, detector) ? 'false' : 'true';
    hostsWithCru.forEach((host) => _toggleAllLinksByHost(model, host, value));
  } catch (error) {
    console.error(error);
  }
  config.notify();
}

/**
 * Given a string host, toggle the links[0-11] selection for all of its CRUs serial:endpoint
 * @param {Object} model
 * @param {String} host
 * @param {String} value - value that should be set for the whole set. If undefined, method will decide based on existing selection
 */
const _toggleAllLinksByHost = (model, host, value = undefined) => {
  const config = model.configuration;
  try {
    if (!value) {
      value = _areAllLinksEnabledForHost(model, host) ? 'false' : 'true';
    }
    Object.keys(config.cruMapByHost.payload[host])
      .forEach((cru) => {
        Object.keys(config.cruMapByHost.payload[host][cru].config)
          .filter((key) => key.match('link[0-9]{1,2}')) // select only fields from links0 to links11
          .forEach((key) => config.cruMapByHost.payload[host][cru].config[key].enabled = value);
      });
  } catch (error) {
    console.error(error);
  }
  config.notify();
}

export {toggleAllLinksCRUCheckBox, toggleAllLinksCheckBox, cruLinkCheckBox};
