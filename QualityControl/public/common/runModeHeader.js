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

import { RunStatus } from '../common/enums/RunStatus.enum.js';
import { h, info } from '/js/src/index.js';

/**
 * Run mode header component showing run information and exit button
 * @param {Model} model - root model of the application
 * @param {FilterModel} filterModel - model that manages filter state
 * @param {PageModel} pageModel - model that manages the state of the page
 * @returns {vnode} - virtual node element
 */
export function runModeHeader(model, filterModel, pageModel) {
  if (!filterModel.inRunMode) {
    return null;
  }

  return h('.run-mode-header.flex-row.items-center.p2.g2.bg-gray-lighter', {
    id: 'run-mode-header',
  }, [
    renderRunModeInfo(filterModel),
    h('.flex-grow'),
    renderExitButton(filterModel, pageModel),
  ]);

  /**
   * Renders the run mode information section
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderRunModeInfo(filterModel) {
    return h('.run-mode-info.flex-row.items-center.g2', {
      id: 'run-mode-info',
    }, [
      renderTitle(),
      renderRunNumber(filterModel.runNumber),
      renderRunStatus(filterModel),
    ]);
  }

  /**
   * Renders the run mode title
   * @returns {vnode} - virtual node element
   */
  function renderTitle() {
    return h('span.run-mode-title', {
      id: 'run-mode-title',
      title: 'Run Mode filters objects by a specific run number and monitors run status.' +
      ' Other filters are disabled while active.',
    }, 'Run Mode');
  }

  /**
   * Renders a run detail item for run number with copy functionality
   * @param {string} runNumber - The run number value to display
   * @returns {vnode} - virtual node element
   */
  function renderRunNumber(runNumber = 'N/A') {
    return h('.run-detail.flex-row.items-center.g1', {
      id: 'run-number',
    }, [
      h('span.gray-darker', {
        id: 'run-number-label',
      }, '#'),
      h('span.text-no-select', {
        id: 'run-number-value',
        title: runNumber === 'N/A' ? 'No run number available' : 'Click to copy run number',
        style: runNumber !== 'N/A' ? 'cursor: pointer; user-select: none;' : 'cursor: default;',
      }, runNumber),
    ]);
  }

  /**
   * Renders the status detail with dropdown
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderRunStatus(filterModel) {
    return h('.run-detail.flex-row.items-center.g1', [
      h('span.gray-darker', 'Status:'),
      h(
        `span.${getStatusClass(filterModel.runStatus)}`,
        { id: 'run-status', style: 'font-weight:bold' },
        filterModel.runStatus || 'Unknown',
      ),
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
      class: filterModel._statusInfoOpen ? 'dropdown-open' : '',
    }, [
      renderInfoButton(filterModel),
      filterModel._statusInfoOpen && renderDropdownMenu(),
    ]);
  }

  /**
   * Renders the info button
   * @param {FilterModel} filterModel - model that manages filter state
   * @returns {vnode} - virtual node element
   */
  function renderInfoButton(filterModel) {
    return h('button.btn.btn-sm', {
      title: 'Show status information',
      onclick: (e) => {
        e.stopPropagation();
        filterModel._statusInfoOpen = !filterModel._statusInfoOpen;
        filterModel.notify();
      },
      style: 'padding: 2px 6px; font-size: 0.75rem;',
    }, info());
  }

  /**
   * Renders the dropdown menu content
   * @returns {vnode} - virtual node element
   */
  function renderDropdownMenu() {
    return h('.dropdown-menu.show', [
      h('.p2.text-left', [
        h('span.gray-darker', 'Status meanings:'),
        h('hr'),
        renderStatusList(),
      ]),
    ]);
  }

  /**
   * Renders the list of all possible statuses
   * @returns {vnode} - virtual node element
   */
  function renderStatusList() {
    return h('div', [
      h('div', ...Object.values(RunStatus).map((status) =>
        h('label', {
          style: 'transition: transform 0.2s;',
          onmouseover: (e) => {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.cursor = 'pointer';
          },
          onmouseout: (e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.cursor = 'default';
          },
        }, h(`span.${getStatusClass(status)}`, { style: 'font-weight:bold' }, status), ' - ', getStatusTitle(status)))),
    ]);
  }

  /**
   * Renders the exit button
   * @param {FilterModel} filterModel - model that manages filter state
   * @param {PageModel} pageModel - model that manages the state of the page
   * @returns {vnode} - virtual node element
   */
  function renderExitButton(filterModel, pageModel) {
    return h('button.btn.btn-sm.btn-outline-secondary', {
      onclick: async () => await filterModel.deactivateRunsMode(pageModel),
      title: 'Exit run mode and show all filters',
    }, 'X Exit');
  }

  /**
   * Returns the CSS class based on the run status
   * @param {string} status - The run status value
   * @returns {string} - The corresponding CSS class
   */
  function getStatusClass(status) {
    if (!status) {
      return 'text-muted';
    }

    switch (status.toLowerCase()) {
      case 'ended':
        return 'status-ended';
      case 'ongoing':
        return 'status-ongoing';
      case 'not_found':
        return 'status-not-found';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Returns the title based on the run status
   * @param {string} status - The run status value
   * @returns {string} - The corresponding title text
   */
  function getStatusTitle(status) {
    if (!status) {
      return 'Status unknown';
    }

    switch (status.toLowerCase()) {
      case 'ended':
        return 'The run has ended successfully. No new paths or objects will be added.';
      case 'ongoing':
        return 'The run is currently ongoing. New paths and objects will be added periodically.';
      case 'not_found':
        return 'The run was not found in the database. Please check the run number.';
      default:
        return 'The status of the run is unknown. Please check the run number or the system status.';
    }
  }
}
