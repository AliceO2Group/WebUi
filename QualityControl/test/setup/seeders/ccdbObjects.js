/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { CCDB_FILTER_FIELDS } from '../../../lib/services/ccdb/CcdbConstants.js';
const { PATH, CREATED, LAST_MODIFIED, ID, VALID_FROM, VALID_UNTIL } = CCDB_FILTER_FIELDS;

export const objects = [
  {
    [PATH]: 'qc/test/object/1',
    [LAST_MODIFIED]: new Date('2023-12-01').valueOf(),
    [CREATED]: new Date('2023-12-01').valueOf(),
    [ID]: '',
    [VALID_FROM]: new Date('2023-12-01').valueOf(),
    [VALID_UNTIL]: new Date('2023-12-02').valueOf(),
  },
  {
    [PATH]: 'qc/test/object/2',
    [LAST_MODIFIED]: new Date('2023-12-02').valueOf(),
    [CREATED]: new Date('2023-12-01').valueOf(),
    [ID]: '',
    [VALID_FROM]: new Date('2023-12-01').valueOf(),
    [VALID_UNTIL]: new Date('2023-12-02').valueOf(),
  },
  {
    [PATH]: 'qc/test/object/11',
    [LAST_MODIFIED]: new Date('2023-12-03').valueOf(),
    [CREATED]: new Date('2023-12-03').valueOf(),
    [ID]: '',
    [VALID_FROM]: new Date('2023-12-03').valueOf(),
    [VALID_UNTIL]: new Date('2023-12-04').valueOf(),
  },
  {
    [PATH]: 'qc/test/object/12',
    [LAST_MODIFIED]: new Date('2024-02-03').valueOf(),
    [CREATED]: new Date('2024-02-03').valueOf(),
    [ID]: '',
    [VALID_FROM]: new Date('2024-02-03').valueOf(),
    [VALID_UNTIL]: new Date('2024-02-04').valueOf(),
  },
];

export const subfolders = [
  'qc/test/object/1',
  'qc/test/object/2',
  'qc/test/object/11',
  'qc/test/object/12',
];

export const MOCK_OBJECT_BY_ID_RESULT = {
  id: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  path: 'qc/test/object/1',
  name: 'qc/test/object/1',
  validFrom: 1656072357492,
  validUntil: 1971432357492,
  createdAt: 1656072357533,
  lastModified: 1656072357000,
  drawOptions: [],
  displayHints: [],
  etag: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  runNumber: '0',
  runType: '0',
  partName: 'send',
  qcCheckName: 'Pedestals/mPedestalChannelFECHG',
  qcQuality: '3',
  qcDetectorName: 'TPC',
  qcVersion: '1.64.0',
  objectType: 'o2::quality_control::core::QualityObject',
  location: '/download/016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  layoutDisplayOptions: [],
  layoutName: 'a-test',
  tabName: 'main',
  ignoreDefaults: false,
};

export const OBJECT_VERSIONS = [
  {
    validFrom: 1656072357492,
    createdAt: 1656072357533,
    id: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  },
  {
    validFrom: 1655916321231,
    createdAt: 1655916321276,
    id: 'b4944c1d-f24a-11ec-a509-c0a80209250c',
  },
];

export const MOCK_OBJECT_3_VERSIONS = [
  {
    validFrom: 1728058750070,
    createdAt: 1728058897718,
    id: 'baffe0b2-826c-11ef-8f19-c0a80209250c',
  },
];

export const OBJECT_VERSIONS_FILTERED_BY_RUN_NUMBER = [
  {
    createdAt: 1656072357533,
    id: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
    validFrom: 1656072357492,
  },
];

export const OBJECT_BY_PATH_RESULT = {
  id: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  path: 'qc/test/object/1',
  name: 'qc/test/object/1',
  validFrom: 1656072357492,
  validUntil: 1971432357492,
  createdAt: 1656072357533,
  lastModified: 1656072357000,
  drawOptions: [],
  displayHints: [],
  etag: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  runNumber: '0',
  runType: '0',
  partName: 'send',
  qcCheckName: 'Pedestals/mPedestalChannelFECHG',
  qcQuality: '3',
  qcDetectorName: 'TPC',
  qcVersion: '1.64.0',
  objectType: 'o2::quality_control::core::QualityObject',
  location: '/download/016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
};

export const OBJECT_3_BY_PATH_RESULT = {
  id: 'baffe0b2-826c-11ef-8f19-c0a80209250c',
  path: 'qc/test/object/12',
  name: 'qc/test/object/12',
  validFrom: 1728058750070,
  validUntil: 1728058895900,
  createdAt: 1728058897718,
  lastModified: 1728058897000,
  drawOptions: [],
  displayHints: 'hist',
  etag: 'baffe0b2-826c-11ef-8f19-c0a80209250c',
  runNumber: '551890',
  runType: 'PHYSICS',
  partName: 'send',
  qcCheckName: undefined,
  qcQuality: undefined,
  qcDetectorName: 'MFT',
  qcTaskName: 'MFTClusterTask',
  qcVersion: '1.150.0',
  objectType: 'o2::quality_control_modules::common::TH1Ratio<TH1F>',
  location: '/download/baffe0b2-826c-11ef-8f19-c0a80209250c',
};

export const TREE_API_OBJECTS = [
  { name: 'qc/test/object/1' },
  { name: 'qc/test/object/2' },
  { name: 'qc/test/object/11' },
  { name: 'qc/test/object/12' },
];

export const OBJECT_LATEST_FILTERED_BY_RUN_NUMBER = [
  {
    [PATH]: 'qc/test/object/1',
    createdAt: 1656072357533,
    name: 'qc/test/object/1',
  },
];

export const OBJECT_3_LATEST_FILTERED_BY_RUN_NUMBER = [
  {
    [PATH]: 'qc/test/object/12',
    createdAt: 1728058897718,
    name: 'qc/test/object/12',
  },
];
