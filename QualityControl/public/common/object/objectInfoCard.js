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

import { h, isContextSecure } from '/js/src/index.js';
import { iconExternalLink } from '/js/src/icons.js';
import { camelToTitleCase, copyToClipboard, prettyFormatDate } from './../utils.js';
import { getBkpRunDetailsUrl } from '../utils.js';
import { visibilityButton } from '../visibilityButton.js';

const SPECIFIC_KEY_LABELS = {
  id: 'ID (etag)',
};

const DATE_FIELDS = ['validFrom', 'validUntil', 'createdAt', 'lastModified'];
const TO_REMOVE_FIELDS = ['etag', 'qcObject', 'versions', 'name', 'location'];
const HIGHLIGHTED_FIELDS = ['runNumber', 'runType', 'path', 'qcVersion'];
const DRAW_OPTIONS_FIELD = 'drawOptions';
const DISPLAY_HINTS_FIELD = 'displayHints';
const LAYOUT_DISPLAY_OPTIONS_FIELD = 'layoutDisplayOptions';

const KEY_TO_RENDER_FIRST = 'path';

/**
 * Builds a panel with information of the object; Fields are parsed according to their category
 * @param {QcObject} qcObject - QC object with its associated details
 * @param {object} style - properties of the vnode
 * @param {(key: string, value: string) => unknown} rowAttributes -
 *  An optional curried function that returns the VNode attribute builder.
 *  Use {@link defaultRowAttributes} exported from this module, supplying the Notification API.
 * @param {() => void} onToggleDrawingOptionsPanel - Callback function to for displaying drawing options
 * @returns {vnode} - panel with information about the object
 * @example
 * ```
 * qcObjectInfoPanel(
 *  qcObject,
 *   { gap: '.5em' },
 *   defaultRowAttributes(model.notification),
 *   () => objectViewModel.toggleDrawingOptionsVisible(),
 * )
 * ```
 */
export const qcObjectInfoPanel = (
  qcObject,
  style = {},
  rowAttributes = () => undefined,
  onToggleDrawingOptionsPanel = null,
) =>
  h('.flex-column.scroll-y#qcObjectInfoPanel', { style }, [
    [
      KEY_TO_RENDER_FIRST,
      ...Object.keys(qcObject)
        .filter((key) => key !== KEY_TO_RENDER_FIRST && !TO_REMOVE_FIELDS.includes(key)),
    ]
      .flatMap((key) => {
        if (key === DRAW_OPTIONS_FIELD) {
          return [
            drawingOptionsInfoRow(
              rowAttributes,
              qcObject[DRAW_OPTIONS_FIELD],
              qcObject[DISPLAY_HINTS_FIELD],
              qcObject[LAYOUT_DISPLAY_OPTIONS_FIELD] ?? null,
              onToggleDrawingOptionsPanel,
            ),
          ];
        }
        if (key === DISPLAY_HINTS_FIELD || key === LAYOUT_DISPLAY_OPTIONS_FIELD) {
          return []; // always hidden (grouped)
        }
        return [infoRow(key, qcObject[key], rowAttributes)];
      }),
  ]);

/**
 * Creates a virtual DOM structure for displaying drawing options with optional layout options
 * and a toggle button for the drawing options panel.
 * @param {(key: string, value: string) => unknown} infoRowAttributes - Attributes for each info row component.
 * @param {object} drawOptions - Current drawing options to display in the info row.
 * @param {object} displayHints - Display hints to show in the info row.
 * @param {object|null} layoutDisplayOptions - Optional layout display options to include in the info row.
 * @param {()=>void|null} onToggleDrawingOptionsPanel - Optional callback to toggle the visibility of the options panel.
 * @returns {vnode} A virtual DOM node representing a drawing options section.
 */
const drawingOptionsInfoRow = (
  infoRowAttributes,
  drawOptions,
  displayHints,
  layoutDisplayOptions = null,
  onToggleDrawingOptionsPanel = null,
) => h('', [
  h('.flex-row.items-center.justify-between', { style: 'padding-bottom:var(--space-s)' }, [
    h('', 'Drawing Options'),
    onToggleDrawingOptionsPanel && h('.absolute.items-center.level3', { style: 'right:0' }, visibilityButton(
      onToggleDrawingOptionsPanel,
      { title: 'Toggle preview drawing options' },
    )),
  ]),
  h('.w-100', { style: 'height:1px; background:#d9d9d9; margin: 0 auto;' }),
  h('.flex-column.g1', { style: 'margin-left: var(--space-s);' }, [
    infoRow(DRAW_OPTIONS_FIELD, drawOptions, infoRowAttributes),
    infoRow(DISPLAY_HINTS_FIELD, displayHints, infoRowAttributes),
    layoutDisplayOptions && infoRow(LAYOUT_DISPLAY_OPTIONS_FIELD, layoutDisplayOptions, infoRowAttributes),
  ]),
]);

/**
 * Builds a raw with the key and value information parsed based on their type
 * @param {string} key - key of the object info
 * @param {string|number|object|undefined} value - value of the object info
 * @param {(key: string, value: string) => unknown} infoRowAttributes - method that return given attributes for the row
 * @returns {vnode} - row with object information key and value
 */
const infoRow = (key, value, infoRowAttributes) => {
  const highlightedClasses = HIGHLIGHTED_FIELDS.includes(key) ? '.highlighted' : '';
  const formattedValue = infoPretty(key, value);
  const formattedKey = getUILabel(key);
  const hasValue = value != null && value !== '' && (!Array.isArray(value) || value.length !== 0);
  const bkpRunDetailsUrl = key === 'runNumber' ? getBkpRunDetailsUrl(value) : null;

  return h(`.flex-row.g2.info-row${highlightedClasses}`, [
    h('b.w-25.w-wrapped', formattedKey),
    h('.flex-row.w-75', [
      h(
        '.cursor-pointer.flex-row',
        hasValue && infoRowAttributes(formattedKey, formattedValue),
        formattedValue,
      ),
      bkpRunDetailsUrl && hasValue
        ? h('a.ph2.text-right.actionable-icon', {
          id: 'openRunInBookkeeping',
          title: 'Open run in Bookkeeping',
          href: bkpRunDetailsUrl,
          target: '_blank',
        }, iconExternalLink())
        : '',
    ]),
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
