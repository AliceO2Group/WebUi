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

import { h, isContextSecure } from '/js/src/index.js';
import { camelToTitleCase, copyToClipboard, prettyFormatDate } from './../utils.js';

const SPECIFIC_KEY_LABELS = {
  id: 'ID (etag)',
};

const DATE_FIELDS = ['validFrom', 'validUntil', 'createdAt', 'lastModified'];
const TO_REMOVE_FIELDS = ['etag', 'qcObject', 'versions', 'name', 'location'];
const HIGHLIGHTED_FIELDS = ['runNumber', 'runType', 'path', 'qcVersion'];

const KEY_TO_RENDER_FIRST = 'path';

/**
 * Builds a panel with information of the object; Fields are parsed according to their category
 * @param {QCObjectDTO} qcObject - QC object with its associated details
 * @param {object} style - properties of the vnode
 * @param {function(Notification): function(string, string): object} rowAttributes -
 *  An optional curried function that returns the VNode attribute builder.
 *  Use {@link defaultRowAttributes} exported from this module, supplying the Notification API.
 * @returns {vnode} - panel with information about the object
 * @example
 * ```
 * qcObjectInfoPanel(qcObject, {}, defaultRowAttributes(model.notification))
 * ```
 */
export const qcObjectInfoPanel = (qcObject, style = {}, rowAttributes = () => undefined) =>
  h('.flex-column.scroll-y#qcObjectInfoPanel', { style }, [
    [
      KEY_TO_RENDER_FIRST,
      ...Object.keys(qcObject)
        .filter((key) =>
          key !== KEY_TO_RENDER_FIRST && !TO_REMOVE_FIELDS.includes(key)),
    ]
      .map((key) => infoRow(key, qcObject[key], rowAttributes)),
  ]);

/**
 * Builds a raw with the key and value information parsed based on their type
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @param {function(key, value)} infoRowAttributes - function that return given attributes for the row
 * @returns {vnode} - row with object information key and value
 */
const infoRow = (key, value, infoRowAttributes) => {
  const highlightedClasses = HIGHLIGHTED_FIELDS.includes(key) ? '.highlighted' : '';
  const formattedValue = infoPretty(key, value);
  const formattedKey = getUILabel(key);

  const hasValue = value != null && value !== '' && (!Array.isArray(value) || value.length !== 0);

  return h(`.flex-row.g2.info-row${highlightedClasses}`, [
    h('b.w-25.w-wrapped', formattedKey),
    h('.w-75.cursor-pointer', hasValue && infoRowAttributes(formattedKey, formattedValue), formattedValue),
  ]);
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

  return camelToTitleCase(key);
};

/**
 * Parses the value and returns it in a specific format based on type
 * safely handeling nulls and objects.
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @returns {string} - string representation of the value passed
 */
const infoPretty = (key, value) => {
  if (value == null) {
    return '-';
  }

  if (DATE_FIELDS.includes(key)) {
    return prettyFormatDate(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.join(', ')
      : '-';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

/**
 * Default function to configure the info row vnode attributes
 * @typedef {import('/js/src/index.js').Notification} Notification
 * @param {Notification} notification - Notification API from WebUI framework
 * @returns {function(string, string): object} object containing the constructed vnode attributes
 */
export const defaultRowAttributes = (notification) =>
  (key, value) => ({
    onclick: async (e) => {
      // to allowing the default behaviour for clicking multiple times
      const clickCount = e.detail;
      if (clickCount === 1) {
        if (!isContextSecure()) {
          return;
        }

        try {
          await copyToClipboard(value);
          notification.show('Value has been successfully copied to clipboard', 'success', 1500);
        } catch (error) {
          notification.show(`Failed to copy to clipboard: ${error.message}`, 'danger', 1500);
        }
      }
    },
    title: `Copy ${key}`,
  });
