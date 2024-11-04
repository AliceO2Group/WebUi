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
import { MOCK_OBJECT_DETAILS_RESPONSE, MOCK_OBJECT_IDENTIFICATION_RESPONSE, MOCK_OBJECT_VERSIONS_RESPONSE }
  from './seeders/object-view/mock-object-view.js';

const CCDB_URL = `${config.ccdb.protocol}://${config.ccdb.hostname}:${config.ccdb.port}`;
const CCDB_API_PATH_LATEST = `/latest/${config.ccdb.prefix}`;
const CCDB_API_PATH_OBJECT_IDENTIFICATION = '/latest/qc/test/object/1';
const CCDB_API_PATH_OBJECT_DETAILS =
'/qc/test/object/1/1656072357492/016fa8ac-f3b6-11ec-b9a9-c0a80209250c';

const { PATH, CREATED, LAST_MODIFIED, ID, VALID_FROM, VALID_UNTIL } = CCDB_FILTER_FIELDS;

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

  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
      'X-Filter-Fields': `${PATH},${ID},${VALID_FROM},${VALID_UNTIL}`,
    },
  }).persist()
    .get(CCDB_API_PATH_OBJECT_IDENTIFICATION)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)
    .get(`${CCDB_API_PATH_LATEST}/object/1`)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE);

  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
    },
  }).persist()
    .head(CCDB_API_PATH_OBJECT_DETAILS)
    .reply(200, null, MOCK_OBJECT_DETAILS_RESPONSE.headers)
    .head('/qc/test/object/1/1656072357492/1971432357492/016fa8ac-f3b6-11ec-b9a9-c0a80209250c')
    .reply(200, null, MOCK_OBJECT_DETAILS_RESPONSE.headers);

  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
      'X-Filter-Fields': `${VALID_FROM},${ID},${CREATED}`,
    },
  })
    .persist()
    // .get('/browse/qc/EMC/MO/Pedestals/mPedestalChannelFECHG')
    // .reply(200, MOCK_OBJECT_VERSIONS_RESPONSE)
    .get('/browse/qc/test/object/1')
    .reply(200, MOCK_OBJECT_VERSIONS_RESPONSE);
};
