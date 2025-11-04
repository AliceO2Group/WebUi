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
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { CCDB_FILTER_FIELDS, CCDB_MONITOR, CCDB_VERSION_KEY } from './../../lib/services/ccdb/CcdbConstants.js';
import { config } from './../config.js';
import { objects, subfolders } from './seeders/ccdbObjects.js';
import { MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER,
  MOCK_OBJECT_1_DETAILS_RESPONSE, MOCK_OBJECT_IDENTIFICATION_RESPONSE,
  MOCK_OBJECT_VERSIONS_RESPONSE, MOCK_OBJECT_VERSIONS_RESPONSE_RUN_NUMBER_FILTER }
  from './seeders/object-view/mock-object-view.js';
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
const acceptHeader = { reqheaders: { Accept: 'application/json' } };
const xFieldHeader1 =
  { reqheaders: { Accept: 'application/json', 'X-Filter-Fields': `${PATH},${CREATED},${LAST_MODIFIED}` } };
const xFieldHeader2 =
  { reqheaders: { Accept: 'application/json', 'X-Filter-Fields': `${PATH},${ID},${VALID_FROM},${VALID_UNTIL}` } };
const xFieldHeader3 =
  { reqheaders: { Accept: 'application/json', 'X-Filter-Fields': `${VALID_FROM},${ID},${CREATED}` } };
const xFieldHeader4 = { reqheaders: { Accept: 'application/json', 'X-Filter-Fields': PATH } };

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const filePath = join(_dirname, '../demoData/qcdbRoot/TObject_1732326337752.root');

/**
 * Setup nock environment for ccdb which is to intercept all CCDB requests used in the Frontend test suites
 * Requests will have to persist as tests might run multiple times and we want to intercept all
 */
export const initializeNockForCcdb = () => {
  nock(CCDB_URL, acceptHeader).persist()
    .get(CCDB_API_MONITOR)
    .reply(200, versionResponse);

  nock(CCDB_URL)
    .replyContentLength()
    .get('/download/95c51d3b-9f64-11f0-bd06-bcb9d03ba1a2')
    .replyWithFile(200, filePath, {
      'Content-Type': 'application/root',
    }).persist();

  nock(CCDB_URL, xFieldHeader1).persist()
    .get(`${CCDB_API_PATH_LATEST}.*`)
    .reply(200, { objects })
    .get(`${CCDB_API_PATH_LATEST}.*/RunNumber=0`)
    .reply(200, MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER);

  nock(CCDB_URL, xFieldHeader4).persist()
    .get(`${CCDB_API_PATH_LATEST}.*/RunNumber=0`)
    .reply(200, MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER);

  nock(CCDB_URL, xFieldHeader1).persist()
    .get(`${CCDB_API_PATH_LATEST}.*/RunNumber=500001`)
    .reply(200, MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER);

  nock(CCDB_URL, xFieldHeader1).persist()
    .get(`${CCDB_API_PATH_LATEST}.*/RunNumber=500002`)
    .reply(200, MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER);

  nock(CCDB_URL, xFieldHeader1).persist()
    .get(`${CCDB_API_PATH_LATEST}.*/RunNumber=500003`)
    .reply(200, MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER);

  nock(CCDB_URL, xFieldHeader1).persist()
    .get(`${CCDB_API_PATH_LATEST}.*/RunNumber=566138`)
    .reply(200, MOCK_LATEST_OBJECT_FILTERED_BY_RUN_NUMBER);

  nock(CCDB_URL, acceptHeader).persist()
    .get(`${CCDB_API_PATH_TREE}.*`)
    .reply(200, { subfolders })

    .head('/qc/test/object/1/1656072357492/1971432357492/016fa8ac-f3b6-11ec-b9a9-c0a80209250c')
    .reply(200, null, MOCK_OBJECT_1_DETAILS_RESPONSE)

    .head(CCDB_API_PATH_OBJECT_DETAILS)
    .reply(200, null, MOCK_OBJECT_1_DETAILS_RESPONSE)

    .head('/qc/test/object/1/1656072357492/1971432357492/016fa8ac-f3b6-11ec-b9a9-c0a80209250c/RunNumber=0')
    .reply(200, null, MOCK_OBJECT_1_DETAILS_RESPONSE);

  nock(CCDB_URL, xFieldHeader2).persist()
    .get(CCDB_API_PATH_OBJECT_IDENTIFICATION)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)

    .get(`${CCDB_API_PATH_LATEST}/object/1`)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)

    .get(`${CCDB_API_PATH_LATEST}/object/1/RunNumber=0`)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)

    .get(CCDB_API_PATH_TREE_OBJECT_IDENTIFICATION)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE)

    .get(`${CCDB_API_PATH_TREE}/object/1`)
    .reply(200, MOCK_OBJECT_IDENTIFICATION_RESPONSE);

  nock(CCDB_URL, xFieldHeader3)
    .persist()
    .get('/browse/qc/test/object/1')
    .reply(200, MOCK_OBJECT_VERSIONS_RESPONSE)

    .get('/browse/qc/test/object/1/RunNumber=0')
    .reply(200, MOCK_OBJECT_VERSIONS_RESPONSE_RUN_NUMBER_FILTER);

  nock(CCDB_URL)
    .persist()
    .replyContentLength()
    .get(`${CCDB_API_DOWNLOAD_ROOT_OBJECT.path}/${CCDB_API_DOWNLOAD_ROOT_OBJECT.id}`)
    .reply(200, fileContent);

  //runs mode
};
