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
const { PATH, CREATED, LAST_MODIFIED } = CCDB_FILTER_FIELDS;

export const objects = [
  {
    [PATH]: 'qc/test/object/1',
    [LAST_MODIFIED]: new Date('2023-12-01').valueOf(),
    [CREATED]: new Date('2023-12-01').valueOf(),
  },
  {
    [PATH]: 'qc/test/object/2',
    [LAST_MODIFIED]: new Date('2023-12-02').valueOf(),
    [CREATED]: new Date('2023-12-01').valueOf(),
  },
  {
    [PATH]: 'qc/test/object/11',
    [LAST_MODIFIED]: new Date('2023-12-03').valueOf(),
    [CREATED]: new Date('2023-12-03').valueOf(),
  },
];
