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
import { readFileSync } from 'fs';
import { CCDB_FILTER_FIELDS, CCDB_MONITOR, CCDB_VERSION_KEY } from './../../lib/services/ccdb/CcdbConstants.js';
import { config } from './../config.js';
import { objects, subfolders } from './seeders/ccdbObjects.js';
import { MOCK_OBJECT_DETAILS_RESPONSE, MOCK_OBJECT_IDENTIFICATION_RESPONSE, MOCK_OBJECT_VERSIONS_RESPONSE,
  MOCK_OBJECT_VERSIONS_RESPONSE_RUN_NUMBER_FILTER } from './seeders/object-view/mock-object-view.js';
import { CCDB_MOCK_VERSION } from './seeders/ccdbVersion.js';

const CCDB_URL = `${config.ccdb.protocol}://${config.ccdb.hostname}:${config.ccdb.port}`;
const CCDB_API_PATH_LATEST = `/latest/${config.ccdb.prefix}`;
const CCDB_API_PATH_OBJECT_IDENTIFICATION = '/latest/qc/test/object/1';
const CCDB_API_PATH_TREE = `/tree/${config.ccdb.prefix}`;
const CCDB_API_PATH_TREE_OBJECT_IDENTIFICATION = '/tree/qc/test/object/1';
const CCDB_API_PATH_OBJECT_DETAILS =
'/qc/test/object/1/1656072357492/016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
const CCDB_API_DOWNLOAD_ROOT_OBJECT = {
  id: '016fa8ac-f3b6-11ec-b9a9-c0a80209250c',
  path: '/download',
  objectPath: 'test/setup/seeders/object-view/mock-object.root',
};
const CCDB_API_MONITOR = `/monitor/${CCDB_MONITOR}/.*/${CCDB_VERSION_KEY}`;
const { PATH, CREATED, LAST_MODIFIED, ID, VALID_FROM, VALID_UNTIL } = CCDB_FILTER_FIELDS;

const versionResponse = {};
versionResponse[CCDB_MONITOR] = {};
versionResponse[CCDB_MONITOR][config.ccdb.hostname] = [CCDB_MOCK_VERSION];
const fileContent = readFileSync(CCDB_API_DOWNLOAD_ROOT_OBJECT.objectPath);

/**
 * Setup nock environment for ccdb which is to intercept all CCDB requests used in the Frontend test suites
 * Requests will have to persist as tests might run multiple times and we want to intercept all
 */
export const initializeNockForCcdb = () => {
  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
    },
  }).persist()
    .get(CCDB_API_MONITOR)
    .reply(200, versionResponse);

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
    reqheaders: { Accept: 'application/json' },
  }).persist()
    .get(`${CCDB_API_PATH_TREE}.*`)
    .reply(200, {
      subfolders,
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
      'X-Filter-Fields': `${PATH},${ID},${VALID_FROM},${VALID_UNTIL}`,
    },
  }).persist()
    .get(CCDB_API_PATH_OBJECT_IDENTIFICATION)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)
    .get(`${CCDB_API_PATH_LATEST}/object/1/RunNumber=0`)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE);

  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
      'X-Filter-Fields': `${PATH},${ID},${VALID_FROM},${VALID_UNTIL}`,
    },
  }).persist()
    .get(CCDB_API_PATH_TREE_OBJECT_IDENTIFICATION)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)
    .get(`${CCDB_API_PATH_TREE}/object/1`)
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
    },
  }).persist()
    .head(CCDB_API_PATH_OBJECT_DETAILS)
    .reply(200, null, MOCK_OBJECT_DETAILS_RESPONSE.headers)
    .head('/qc/test/object/1/1656072357492/1971432357492/016fa8ac-f3b6-11ec-b9a9-c0a80209250c/RunNumber=0')
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

  nock(CCDB_URL, {
    reqheaders: {
      Accept: 'application/json',
      'X-Filter-Fields': `${VALID_FROM},${ID},${CREATED}`,
    },
  })
    .persist()
    .get('/browse/qc/test/object/1/RunNumber=0')
    .reply(200, MOCK_OBJECT_VERSIONS_RESPONSE_RUN_NUMBER_FILTER);

  nock(CCDB_URL)
    .persist()
    .replyContentLength()
    .get(`${CCDB_API_DOWNLOAD_ROOT_OBJECT.path}/${CCDB_API_DOWNLOAD_ROOT_OBJECT.id}`)
    .reply(200, fileContent);
};
