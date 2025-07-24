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
 * @param {PageModel} pageModel - model that manages the state of the page
 * @returns {vnode} - virtual node element
 */
export function runModeHeader(filterModel, pageModel) {
  if (!filterModel.inRunMode) {
    return null;
  }

  return h('.flex-row.items-center.justify-center.p2.g2.bg-gray-lighter', {
    id: 'runModeHeader',
  }, [
    renderRunModeInfo(filterModel),
    renderExitButton(filterModel, pageModel),
  ]);

  /**
   * Renders the run mode information section
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderRunModeInfo(filterModel) {
    return h('.flex-row.items-center.g2', [
      // renderTitle(),
      renderRunNumber(filterModel.runNumber),
      h('div.mh2', {
        style: 'width: 1px; height: 1.2em; background-color: var(--color-gray-dark);',
      }),
      renderRunStatus(filterModel),
    ]);
  }

  /**
   * Renders the run mode title
   * @returns {vnode} - virtual node element
   */

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
    return h('.flex-row.items-center.g1', {
      id: 'runStatus',
    }, [
      h('span.gray-darker', 'Status:'),
      h(`b.${getStatusClass(filterModel.runStatus)}`, filterModel.runStatus || 'Unknown'),
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
    }, Object.values(RunStatus).map((status) => h('div.flex-row.items-center.mv1', {
      style: 'white-space: nowrap;',
    }, [
      h('div.flex-row.items-center.g1', [
        h('badge.bg-gray-light', h(`b.${getStatusClass(status)}`, [status])),
        h('span.gray-darker', ` - ${getStatusTitle(status)}`),
      ]),
    ])));
  }

  /**
   * Renders the exit button
   * @param {FilterModel} filterModel - model that manages filter state
   * @param {PageModel} pageModel - model that manages the state of the page
   * @returns {vnode} - virtual node element
   */
  function renderExitButton(filterModel, pageModel) {
    return h('button.btn.btn-sm', {
      id: 'exitRunModeButton',
      onclick: async () => await filterModel.deactivateRunsMode(pageModel),
      title: 'Exit run mode and show all filters',
    }, 'Exit');
  }

  /**
   * Returns the CSS class based on the run status
   * @param {string} status - The run status value
   * @returns {string} - The corresponding CSS class
   */
  function getStatusClass(status) {
    switch (status) {
      case RunStatus.ONGOING:
        return 'status-ongoing';
      case RunStatus.NOT_FOUND:
        return 'danger';
      case RunStatus.ENDED:
        return 'primary';
      default:
        return 'gray-darker';
    }
  }

  /**
   * Returns the title based on the run status
   * @param {string} status - The run status value
   * @returns {string} - The corresponding title text
   */
  function getStatusTitle(status) {
    switch (status) {
      case RunStatus.ENDED:
        return 'The run has ended successfully. No new paths or objects will be added.';
      case RunStatus.ONGOING:
        return 'The run is currently ongoing. New paths and objects will be added periodically.';
      case RunStatus.NOT_FOUND:
        return 'The run was not found in the database. Please check the run number.';
      default:
        return 'The status of the run is unknown. Please check the run number or the system status.';
    }
  }
}
