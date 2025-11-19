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
 * or submit itself to any jurisdiction.p
 */

import { h } from '/js/src/index.js';
import { prettyFormatDate } from './../utils.js';

const SPECIFIC_KEY_LABELS = {
  id: 'ID (etag)',
};

const DATE_FIELDS = ['validFrom', 'validUntil', 'createdAt', 'lastModified'];
const TO_REMOVE_FIELDS = ['etag', 'qcObject', 'versions', 'name', 'location'];
const HIGHLIGHTED_FIELDS = ['runNumber', 'runType', 'path', 'qcVersion'];

const KEY_TO_RENDER_FIRST = 'path';

/**
 * Builds a panel with information of the object; Fields are parsed according to their category
 * @param {Model} model - root object of the framework
 * @param {QCObjectDTO} qcObject - QC object with its associated details
 * @param {object} style - properties of the vnode
 * @returns {vnode} - panel with information about the object
 */
export const qcObjectInfoPanel = (model, qcObject, style = {}) =>
  h('.flex-column.scroll-y#qcObjectInfoPanel', { style }, [
    [
      KEY_TO_RENDER_FIRST,
      ...Object.keys(qcObject)
        .filter((key) =>
          key !== KEY_TO_RENDER_FIRST && !TO_REMOVE_FIELDS.includes(key)),
    ]
      .map((key) => infoRow(model, key, qcObject[key])),
  ]);

/**
 * Builds a raw with the key and value information parsed based on their type
 * @param {Model} model - root object of the framework
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @returns {vnode} - row with object information key and value
 */
const infoRow = (model, key, value) => {
  const highlightedClasses = HIGHLIGHTED_FIELDS.includes(key) ? '.info-row' : '';
  const formattedValue = infoPretty(key, value);

  return h(`.flex-row.g2${highlightedClasses}`, [
    h('b.w-25.w-wrapped', getUILabel(key)),
    h('.w-75', {
      ...infoRowAttributes(model, formattedValue),
      style: 'cursor: pointer; user-select: text;',
    }, formattedValue),
  ]);
};

/**
 * Transforms a camelCase string into human-readable Title Case format,
 * inserts a space before every uppercase letter and ensures the first
 * character is capatilized
 * @param {string} key - key of the object info
 * @returns {string} - formatted label for the given key
 */
const defaultKeyTransform = (key) => {
  const spaced = key.replace(/([A-Z])/g, ' $1');
  const titleCase = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  return titleCase;
};

/**
 * Retrieves the final UI-friendly label for given data key
 * * Priority:
 * 1. Manual override using `SPECIFIC_KEY_LABELS`
 * 2. Use `defaultKeyTransform` to generate a label
 * @param {string} key - key of the object info
 * @returns {string} - formatted label for the given key
 */
const getUILabel = (key) => {
  if (Object.hasOwn(SPECIFIC_KEY_LABELS, key)) {
    return SPECIFIC_KEY_LABELS[key];
  }

  return defaultKeyTransform(key);
};

/**
 * Parses the value and returns it in a specific format based on type
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @returns {vnode} - value of object based on its type
 */
const infoPretty = (key, value) => {
  if (DATE_FIELDS.includes(key)) {
    return prettyFormatDate(value);
  } else if (Array.isArray(value)) {
    return value.length > 0
      ? value.join(', ')
      : '-';
  }
  return h('', value);
};

/**
 * Configure the info row vnode attributes
 * @param {Model} model - root object of the framework
 * @param {string|number|object|undefined} value - value of the object info
 * @returns {object} - object containing the constructed vnode attributes
 */
const infoRowAttributes = (model, value) => {
  let clickTimeout = undefined;
  const DOUBLE_CLICK_DELAY = 300;

  return {
    onclick: (e) => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = undefined;
        return;
      }

      // to allowing the default behaviour for clicking multiple times
      const clickCount = e.detail;
      if (clickCount === 1) {
        clickTimeout = setTimeout(() => {
          if (!model.isContextSecure()) {
            return;
          }

          model.notification.show('Value has been successfully copied to clipboard', 'success', 1500);
          if (typeof value !== 'string') {
            value = value.dom.textContent;
          }
          navigator.clipboard.writeText(value);

          clickTimeout = undefined;
        }, DOUBLE_CLICK_DELAY);
      }
    },
    title: 'Copy!',
  };
};
