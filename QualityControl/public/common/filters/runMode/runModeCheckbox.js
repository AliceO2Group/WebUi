/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { h } from '/js/src/index.js';

/**
 * Render a run mode switch
 * @param {object} filterModel the filter model
 * @param viewModel
 * @returns {Component} the run mode switch component
 */
export const runModeCheckbox = (filterModel, viewModel) => {
  const { active } = viewModel.model.loader;
  const { isRunModeActivated } = filterModel;

  const handleClick = () => {
    if (isRunModeActivated) {
      filterModel.deactivateRunsMode(viewModel);
    } else {
      filterModel.activateRunsMode(viewModel);
    }
  };
  return h(
    'label.flex-row.g1.items-center.form-check-label',
    {
      style: `cursor:${active ? 'not-allowed' : 'pointer'}`,
    },
    [
      h(
        '.switch',
        [
          h('input', {
            onchange: () => !active && handleClick(),
            disabled: active,
            type: 'checkbox',
            checked: isRunModeActivated,
          }),
          h('span.slider.round', {
            style: `
          background-color:${isRunModeActivated ? 'var(--color-primary)' : 'var(--color-gray)'};
          cursor:${active ? 'not-allowed' : 'pointer'}`,
          }),
        ],
      ),
      'Runs mode',
    ],
  );

  // Button version (commented out):
  // const buttonClass = value ? 'btn.btn-primary' : 'btn';
  // return h('.flex-row.g1.items-center.justify-center', [
  //   h(`button.${buttonClass}`, {
  //     onclick: handleClick,
  //     title: value ? 'Deactivate run mode' : 'Activate run mode',
  //   }, 'Run mode'),
  // ]);
};
