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
import { DRAW_OPTIONS } from '../constants/drawingOptions.js';
import { DISPLAY_HINTS } from '../constants/drawingOptions.js';

/**
 * Display options overlay for a QC object
 * @param {object} options - The options object
 * @param {string} options.id - The unique identifier for the object
 * @param {boolean} options.ignoreDefaults - Whether to ignore default drawing options
 * @param {Array<string>} options.options - Array of selected draw options and display hints
 * @param {Array<string>} options.nonRecognizedDrawingOptions - Array of non-recognized drawing options
 * @param {() => void} options.onToggleIgnoreDefaults - Callback to toggle ignore defaults
 * @param {(option: string) => void} options.onToggleOption - Callback to toggle a drawing option or display hint
 * @returns {vnode} Virtual DOM node representing the display options panel
 */
export const objectDrawingOptions = ({
  id,
  ignoreDefaults,
  options,
  nonRecognizedDrawingOptions,
  onToggleIgnoreDefaults,
  onToggleOption,
}) =>
  h('.absolute-fill.level1.scroll-y.#objectDrawingOptions', [
    h('.absolute.right-0.top-0.bg-white.shadow-lg.w-100.h-100.overflow-auto', [
      h('.flex-row.items-center.justify-between.mb2.g2', [
        h('span', 'Drawing Options:'),
        checkboxWithTooltip({
          id: `${id}ignoreDefaults`,
          label: 'Ignore defaults',
          tooltipText: 'Set by ROOT (fOption) and QC Metadata',
          checked: ignoreDefaults,
          onChange: onToggleIgnoreDefaults,
        }),
      ]),
      nonRecognizedDrawingOptions.length > 0 &&
        h('.flex-row.label.mv2.danger', `Non-recognized options: ${nonRecognizedDrawingOptions.join(', ')}`),
      sectionTitle('Draw Options:', ' ROOT draw options'),
      checkboxGrid(DRAW_OPTIONS.map((option) =>
        checkBox(id + option, option, options.includes(option), () => onToggleOption(option)))),
      sectionTitle('Display Hints:', ' Canvas display hints'),
      checkboxGrid(DISPLAY_HINTS.map((option) =>
        checkBox(id + option, option, options.includes(option), () => onToggleOption(option)))),
    ]),
  ]);

const checkboxGrid = (children) =>
  h('.flex-column.g2', {
    style: {
      display: 'grid',
      gap: '8px 12px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 115px))',
      maxWidth: '400px',
    },
  }, children);

const sectionTitle = (label, tooltipText) =>
  h('.flex-row.mv2', h('.tooltip', [h('label.m0', label), h('.tooltiptext', tooltipText)]));

const checkBox = (id, option, checked, onChange) =>
  h('.form-check', [
    h('input.form-check-input', {
      type: 'checkbox',
      id: id,
      checked,
      onchange: onChange,
    }),
    h('label.m0', { for: id }, option),
  ]);

const checkboxWithTooltip = ({ id, label, tooltipText, checked, onChange }) =>
  h('.form-check.tooltip.mt2-sm.mh2', [
    h('input.form-check-input', {
      type: 'checkbox',
      id: id,
      checked,
      onchange: onChange,
    }),
    h('label.m0', { for: id }, label),
    h('span.tooltiptext', tooltipText),
  ]);
