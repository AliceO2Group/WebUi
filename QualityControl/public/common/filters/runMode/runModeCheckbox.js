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

import { h, iconWarning, switchCase } from '/js/src/index.js';
import { IntegratedServices } from '../../../../library/enums/Status/integratedServices.enum.js';
import { ServiceStatus } from '../../../../library/enums/Status/serviceStatus.enum.js';
import { spinner } from '../../spinner.js';

/**
 * This component determines whether the Run Mode toggle should be displayed
 * based on the availability and configuration state of the Kafka integrated service.
 * Behavior by service state:
 * - Loading: Displays a spinner while checking whether Run Mode is configured.
 * - Failure: Displays an error box with a warning icon and the failure message returned by the service.
 * - Success:
 *   - {@link ServiceStatus.SUCCESS}: Renders the Run Mode checkbox component.
 *   - {@link ServiceStatus.NOT_CONFIGURED}: Renders nothing (Run Mode is intentionally unavailable).
 *   - Any other state: Displays a generic error box instructing the user to contact an administrator.
 * - Other: Unsupported or irrelevant state.
 * @param {object} filterModel - The filter model containing the aboutViewModel used to locate integrated services.
 * @param {object} viewModel - The view model associated with the current view.
 * @returns {vnode|null} A vnode representing the RunMode switch or kafka state, or `null` if Kafka is not configured.
 */
export const runModeComponent = (filterModel, viewModel) =>
  filterModel.model.aboutViewModel.findService(IntegratedServices.KAFKA)?.match({
    Loading: () => spinner(2, 'Checking if RunMode is configured'),
    Failure: (payload) => h('.error-box.danger.flex-column.justify-center.f6.text-center', { id: 'run-mode-failure' }, [
      h('span.error-icon', { title: 'RunMode is unavailable. Please contact administrator.' }, iconWarning()),
      h('span', payload.status.message),
    ]),
    Success: (payload) =>
      switchCase(
        payload.status.category,
        {
          [ServiceStatus.SUCCESS]: () => runModeCheckbox(filterModel, viewModel),
        },
        () => {},
      )(),
    Other: () => {},
  });

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
      id: 'run-mode-switch',
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
