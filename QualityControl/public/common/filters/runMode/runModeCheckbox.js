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
 * @param {object} viewModel the model of the view
 * @returns {Component} the run mode switch component
 */
export const runModeCheckbox = (filterModel, viewModel) => {
  const { isRunModeActivated } = filterModel;

  const handleClick = () => {
    if (isRunModeActivated) {
      filterModel.deactivateRunsMode(viewModel);
    } else {
      filterModel.activateRunsMode(viewModel);
    }
  };
  const isAvailable = filterModel.validateRunNumber();
  return h(
    'label.flex-row.g1.items-center.form-check-label',
    {
      style: `cursor:${isAvailable ? 'pointer' : 'not-allowed'}`,
    },
    [
      h(
        '.switch',
        [
          h('input', {
            onchange: () => isAvailable && handleClick(),
            type: 'checkbox',
            checked: isRunModeActivated,
          }),
          h(`span.slider.round.bg-${
            isRunModeActivated ? 'primary' : 'gray'
          }`, {
            style: `
          cursor: ${isAvailable ? 'pointer' : 'not-allowed'};`,
          }),
        ],
      ),
      'Run mode',
    ],
  );
};
