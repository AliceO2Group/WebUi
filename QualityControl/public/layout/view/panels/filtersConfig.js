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

import { FilterType } from '../../../common/filters/filterTypes.js';

/**
 * Returns an array of filter configuration objects used to render dynamic filter inputs.
 * @param {FilterService} filterService - service to get the data to populate the filters
 * @param {Array<string>} filterService.runTypes - run types to show in the filter
 * @returns {Array<object>} Filter configuration array
 */
export const filtersConfig = ({ runTypes }) => [
  {
    type: FilterType.INPUT,
    queryLabel: 'RunNumber',
    placeholder: 'RunNumber (e.g. 546783)',
    id: 'runNumberLayoutFilter',
    inputType: 'number',
  },
  {
    type: FilterType.DROPDOWN,
    queryLabel: 'RunType',
    placeholder: 'RunType (any)',
    id: 'runTypeLayoutFilter',
    options: runTypes,
  },
  {
    type: FilterType.INPUT,
    queryLabel: 'PeriodName',
    placeholder: 'PeriodName (e.g. LHC23c)',
    id: 'periodNameLayoutFilter',
  },
  {
    type: FilterType.INPUT,
    queryLabel: 'PassName',
    placeholder: 'PassName (e.g. apass2)',
    id: 'passNameLayoutFilter',
  },
];
