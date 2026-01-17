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
import { config } from '../config.js';
import { BKP_MOCK_DATA } from './seeders/bkp-mock-data.js';

const BKP_URL = `${config.bookkeeping.url}`;
const TOKEN_PATH = `?token=${config.bookkeeping.token}`;
const BKP_API_PATH_RUN_TYPES = '/api/runTypes';

/**
 * Setup nock environment for bookkeeping which is to intercept Bookkeeping requests used in the Frontend test suites
 */
export const initializeNockForBkp = () => {
  nock(BKP_URL)
    .persist()
    .get(BKP_API_PATH_RUN_TYPES + TOKEN_PATH)
    .reply(200, {
      data:
        BKP_MOCK_DATA.runTypes,
    });
  nock(BKP_URL)
    .persist()
    .get(`/api/status/database${TOKEN_PATH}`)
    .reply(200, {
      data: {
        status: {
          ok: true,
          configured: true,
        },
      },
    });
  nock(BKP_URL)
    .persist()
    .get(`/api/detectors${TOKEN_PATH}`)
    .reply(200, {
      data: [
        {
          id: 17,
          name: 'ACO',
          type: 'PHYSICAL',
          createdAt: 1765468282000,
          updatedAt: 1765468282000,
        },
        {
          id: 1,
          name: 'CPV',
          type: 'PHYSICAL',
          createdAt: 1765468282000,
          updatedAt: 1765468282000,
        },
        {
          id: 23,
          name: 'EVS',
          type: 'AOT-EVENT',
          createdAt: 1765468282000,
          updatedAt: 1765468282000,
        },
        {
          id: 21,
          name: 'GLO',
          type: 'QC',
          createdAt: 1765468282000,
          updatedAt: 1765468282000,
        },
        {
          id: 15,
          name: 'TST',
          type: 'VIRTUAL',
          createdAt: 1765468282000,
          updatedAt: 1765468282000,
        },
      ],
    });
  nock(BKP_URL)
    .persist()
    .get(`/api/runs/0${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    });
  nock(BKP_URL)
    .get(`/api/runs/500001${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/500001${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/500001${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: '2023-12-01T10:30:00Z',
      },
    })
    .get(`/api/runs/500001${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: '2023-12-01T10:30:00Z',
      },
    });
  nock(BKP_URL)
    .persist()
    .get(`/api/runs/500002${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    });
  nock(BKP_URL)
    .persist()
    .get(`/api/runs/500003${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    });
  nock(BKP_URL)
    .get(`/api/runs/566138${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/566138${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/566138${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/566138${TOKEN_PATH}`)
    .reply(200, {
      data: { timeO2End: 'hello' },
    });
};
