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

import { RunStatus } from '../../library/runStatus.enum.js';
import { h, info } from '/js/src/index.js';

/**
 * Run mode header component showing run information and exit button
 * @param {FilterModel} filterModel - model that manages filter state
 * @param {object} viewModel - model that manages the state of the view
 * @returns {vnode} - virtual node element
 */
export function runModeHeader(filterModel, viewModel) {
  if (!filterModel.inRunMode) {
    return null;
  }

  return h('.flex-row.items-center.justify-center.p2.g2.bg-gray-lighter', {
    id: 'runModeHeader',
  }, [
    renderRunModeInfo(filterModel),
    renderExitButton(filterModel, viewModel),
  ]);

  /**
   * Renders the run mode information section
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderRunModeInfo(filterModel) {
    return h('.flex-row.items-center.g2', [
      renderRunNumber(filterModel.runNumber),
      h('div.mh2', {
        style: 'width: 1px; height: 1.2em; background-color: var(--color-gray-dark);',
      }),
      renderRunStatus(filterModel),
    ]);
  }

  /**
   * Renders a run detail item for run number with copy functionality
   * @param {string} runNumber - The run number value to display
   * @returns {vnode} - virtual node element
   */
  function renderRunNumber(runNumber) {
    return h(
      '.flex-row.items-center.g1',
      { id: 'runNumber' },
      [
        h('span.gray-darker', 'Run'),
        h('b', `#${runNumber}`),
      ],
    );
  }

  /**
   * Renders the status detail with dropdown
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderRunStatus(filterModel) {
    const statusClass = filterModel.runStatus === RunStatus.ONGOING ? 'status-ongoing' : 'primary';
    return h('.flex-row.items-center.g1', {
      id: 'runStatus',
    }, [
      h('span.gray-darker', 'Status:'),
      h(`b.${statusClass}`, filterModel.runStatus),
      renderStatusInfoDropdown(filterModel),
    ]);
  }

  /**
   * Renders the status info dropdown
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderStatusInfoDropdown(filterModel) {
    return h('.dropdown.mh1', {
      class: filterModel.statusInfoOpen ? 'dropdown-open' : '',
    }, [
      renderInfoButton(filterModel),
      filterModel.statusInfoOpen && renderDropdownMenu(),
    ]);
  }

  /**
   * Renders the info button
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderInfoButton(filterModel) {
    return h('button.btn.btn-sm', {
      id: 'runsModeInfoButton',
      title: 'Show status information',
      onclick: (e) => {
        e.stopPropagation();
        filterModel.statusInfoOpen = !filterModel.statusInfoOpen;
        filterModel.notify();
      },
    }, info());
  }

  /**
   * Renders the dropdown menu content
   * @returns {vnode} - virtual node element
   */
  function renderDropdownMenu() {
    return h('.dropdown-menu', {
      id: 'statusInfoDropdown',
    }, [
      h('.p2', [
        h('div.gray-darker.mv1', 'Status meanings:'),
        h('hr.mv1'),
        renderStatusList(),
        h('span', '* Note: All other filters have been removed. Only the run number filter is applied.'),
      ]),
    ]);
  }

  /**
   * Renders the list of all possible statuses
   * @returns {vnode} - virtual node element
   */
  function renderStatusList() {
    return h('div', {
      id: 'runStatusList',
    }, [
      h('div.flex-row.items-center.mv1', {
        style: 'white-space: nowrap;',
      }, [
        h('div.flex-row.items-center.g1', [
          h('b.status-ongoing', [RunStatus.ONGOING]),
          h('span.gray-darker', ' - The run is currently ongoing. New paths and objects will be added periodically.'),
        ]),
      ]),
      h('div.flex-row.items-center.mv1', {
        style: 'white-space: nowrap;',
      }, [
        h('div.flex-row.items-center.g1', [
          h('b.primary', [RunStatus.ENDED]),
          h('span.gray-darker', ' - The run has ended successfully. No new paths or objects will be added.'),
        ]),
      ]),
    ]);
  }

  /**
   * Renders the exit button
   * @param {FilterModel} filterModel - model that manages filter state
   * @param {object} viewModel - model that manages the state of the view
   * @returns {vnode} - virtual node element
   */
  function renderExitButton(filterModel, viewModel) {
    return h('button.btn.btn-sm', {
      id: 'exitRunModeButton',
      onclick: async () => await filterModel.deactivateRunsMode(viewModel),
      title: 'Exit run mode and show all filters',
    }, 'Exit');
  }
}
