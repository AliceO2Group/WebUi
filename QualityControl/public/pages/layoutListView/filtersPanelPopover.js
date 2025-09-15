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

// Adopted from Bookkeeping/lib/public/components/Filters/common/filtersPanelPopover.js
import { h, info, popover, PopoverAnchors, PopoverTriggerPreConfiguration } from '/js/src/index.js';
// import { tooltip } from '../../common/popover/tooltip.js';

//imports for JSDoc + VSCode navigation:
// eslint-disable-next-line no-unused-vars
import { createFilterModel } from './Filter.js';

/**
 * Return the filters panel popover trigger
 * @return {Component} the button component
 */
const filtersToggleTrigger = () => h('button#openFilterToggle.btn.btn.btn-primary', 'Filters');

/**
 * Create main header of the filters panel
 * @param {import('./Filter').FilterModel} filteringModel {@link createFilterModel} filtering model.
 * @returns {Component} main panel header.
 */
const filtersToggleContentHeader = (filteringModel) => h('.flex-row.justify-between', [
  h('.f4', 'Filters'),
  h(
    'button#reset-filters.btn.btn-danger',
    {
      onclick: () => filteringModel.resetAll(),
      // TODO fix check for active filters over filteringmodel.....
      // ? filteringModel.resetFiltering()
      // : filteringModel.reset(true),
      //   disabled: !filteringModel.isAnyFilterActive(),
      disabled: false,
    },
    'Reset all filters',
  ),
]);

/**
 * Return the filters panel popover content section
 * @param {import('./Filter.js').FilterModel} filterModel the filter model
 * @returns {Component} the filters section
 */
export const filtersSection = (filterModel = {}) =>
  h('.flex-column.g2', [
    'hello world!!',
    filterModel.getAll().forEach((filter)=> {
      filter.getValue.toString();
    }),
    // Object.entries(filtersConfiguration)
    //   .filter(([_, column]) => {
    //     let columnProfiles = column.profiles ?? [profiles.none];
    //     if (typeof columnProfiles === 'string') {
    //       columnProfiles = [columnProfiles];
    //     }
    //     return applyProfile(column, appliedProfile, columnProfiles)?.filter;
    //   })
    //   .map(([columnKey, { name, filterTooltip, filter }]) =>
    //     name
    //       ? [
    //         h(`.flex-row.items-baseline.${columnKey}-filter`, [
    //           h('.w-30.f5.flex-row.items-center.g2', [
    //             name,
    //             filterTooltip ? tooltip(info(), filterTooltip) : null,
    //           ]),
    //           h('.w-70', typeof filter === 'function' ? filter(filteringModel) : filter),
    //         ]),
    //       ]
    //       : typeof filter === 'function' ? filter(filteringModel) : filter),
  ]);

/**
 * Return the filters panel popover content (i.e. the actual filters)
 * @param {FilteringModel} filteringModel the filtering model
 * @param {object} [configuration] additional configuration
 * @param {string} [configuration.profile = profiles.none] profile which filters should be rendered @see Column
 * @returns {Component} the filters panel
 */
const filtersToggleContent = (
  filteringModel,
  configuration = {},
) => h('.w-l.flex-column.p3.g3', [
  filtersToggleContentHeader(filteringModel),
  filtersSection(filteringModel, configuration),
]);

/**
 * Return component composed of the filtering popover and its button trigger
 * @param {FilteringModel} filteringModel the filtering model
 * @param {object} [configuration] optional configuration
 * @returns {Component} the filter component
 */
export const filtersPanelPopover = (filteringModel, configuration) => popover(
  filtersToggleTrigger(),
  filtersToggleContent(filteringModel, configuration),
  {
    ...PopoverTriggerPreConfiguration.click,
    anchor: PopoverAnchors.RIGHT_START,
  },
);
