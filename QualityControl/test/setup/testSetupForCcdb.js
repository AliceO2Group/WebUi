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

import nock from 'nock';
import { CCDB_FILTER_FIELDS } from './../../lib/services/ccdb/CcdbConstants.js';
import { config } from './../config.js';
import { objects } from './seeders/ccdbObjects.js';

const CCDB_URL = `${config.ccdb.protocol}://${config.ccdb.hostname}:${config.ccdb.port}`;
const CCDB_API_PATH_LATEST = `/latest/${config.ccdb.prefix}`;

const { PATH, CREATED, LAST_MODIFIED } = CCDB_FILTER_FIELDS;

/**
 * Setup nock environment for ccdb which is to intercept all CCDB requests used in the Frontend test suites
 * Requests will have to persist as tests might run multiple times and we want to intercept all
 */
export const initializeNockForCcdb = () => {
  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
      'X-Filter-Fields': `${PATH},${CREATED},${LAST_MODIFIED}`,
    },
  }).persist()
    .get(`${CCDB_API_PATH_LATEST}.*`)
    .reply(200, {
      objects,
    });
};
