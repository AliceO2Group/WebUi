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

import { FilterType } from './filterTypes.js';

/**
 * Returns an array of filter configuration objects used to render dynamic filter inputs.
 * @param {FilterService} filterService - service to get the data to populate the filters
 * @param {RemoteData<string[]>} filterService.runTypes - run types to show in the filter
 * @param {RemoteData<DetectorSummary[]>} filterService.detectors - detectors to show in the filter
 * @param {RemoteData<DataPass[]>} filterService.dataPasses - data passes to show in the filter
 * @returns {object[]} Filter configuration array
 */
export const filtersConfig = ({ runTypes, detectors, dataPasses, ongoingRuns }) => [
  {
    type: FilterType.COMBOBOX,
    queryLabel: 'RunNumber',
    placeholder: 'RunNumber (e.g. 546783)',
    id: 'runNumberFilter',
    inputType: 'number',
    options: ongoingRuns,
  },
  {
    type: FilterType.DROPDOWN,
    queryLabel: 'RunType',
    placeholder: 'RunType (any)',
    id: 'runTypeFilter',
    options: runTypes,
  },
  {
    type: FilterType.GROUPED_DROPDOWN,
    queryLabel: 'DetectorName',
    placeholder: 'Detector (any)',
    id: 'detectorFilter',
    options: detectors.match({
      Success: (detectors) => detectors.reduce((acc, detector) => {
        if (!acc[detector.type]) {
          acc[detector.type] = [];
        }
        acc[detector.type].push(detector.name);
        return acc;
      }, {}),
      Other: () => {},
    }),
  },
  {
    type: FilterType.INPUT,
    queryLabel: 'PeriodName',
    placeholder: 'PeriodName (e.g. LHC23c)',
    id: 'periodNameFilter',
  },
  {
    type: FilterType.INPUT_WITH_DROPDOWN,
    queryLabel: 'PassName',
    placeholder: 'PassName (e.g. apass2)',
    id: 'passNameFilter',
    options: dataPasses.match({
      Success: (payload) => payload.reduce((acc, dataPass) => {
        acc[dataPass.name] = dataPass.isFrozen ? { style: 'color: var(--color-gray-dark);' } : {};
        return acc;
      }, {}),
      Other: () => {},
    }),
  },
  {
    type: FilterType.INPUT,
    queryLabel: 'QcVersion',
    placeholder: 'QcVersion (e.g. 1.118.0)',
    id: 'qcVersionFilter',
  },
];

/**
 * Returns a filter configuration object used to render dynamic filter in run mode.
 *   @param {FilterService} filterService - service to get the data to populate the filters
 *   @param {Array<string>} filterService.ongoingRuns - run numbers to show in the dropdown
 * @returns {object} Filter configuration object
 */
export const runModeFilterConfig = ({ ongoingRuns }) => [
  {
    type: FilterType.RUN_MODE,
    queryLabel: 'RunNumber',
    placeholder: 'Select a run number',
    id: 'ongoingRunsFilter',
    inputType: 'number',
    width: 'w-10',
    options: ongoingRuns,
    defaultToFirst: true,
    noOptionsTitle: 'There are no runs ongoing currently',
  },
];
