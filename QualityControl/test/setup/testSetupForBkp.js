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
import { GET_BKP_GUI_STATUS_PATH } from '../../lib/services/BookkeepingService.js';
import { ONGOING_RUN_NUMBER } from './mockKafkaEvents.js';

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
    .get(`${GET_BKP_GUI_STATUS_PATH}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        status: {
          ok: true,
          configured: true,
          version: '1.0.0-mock',
          extras: {
            BASE_URL: BKP_URL,
            PARTIAL_RUN_DETAILS: '/runs/',
          },
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
    .get(`/api/dataPasses${TOKEN_PATH}`)
    .reply(200, {
      data: [
        {
          id: 9,
          name: 'LHC23f_cpass0',
          isFrozen: false,
          versions: [],
          pdpBeamTypes: ['OO'],
          runCount: 1,
          simulationPassesCount: 1,
        },
        {
          id: 2,
          name: 'LHC22b_skimming',
          isFrozen: false,
          versions: [],
          pdpBeamTypes: ['pp'],
          runCount: 2,
          simulationPassesCount: 2,
        },
        {
          id: 5,
          name: 'LHC22b_apass2_skimmed',
          isFrozen: false,
          versions: [],
          pdpBeamTypes: ['PbPb'],
          runCount: 3,
          simulationPassesCount: 1,
        },
        {
          id: 1,
          name: 'LHC22b_apass1',
          isFrozen: false,
          versions: [],
          pdpBeamTypes: ['pp'],
          runCount: 4,
          simulationPassesCount: 0,
        },
        {
          id: 4,
          name: 'LHC22a_apass2',
          isFrozen: false,
          versions: [],
          pdpBeamTypes: ['PbPb'],
          runCount: 5,
          simulationPassesCount: 2,
        },
        {
          id: 3,
          name: 'LHC22a_apass1',
          isFrozen: false,
          versions: [],
          pdpBeamTypes: ['PbPb'],
          runCount: 4,
          simulationPassesCount: 0,
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
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: null,
      },
    })
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
    .reply(200, {
      data: {
        timeO2End: '2023-12-01T10:30:00Z',
      },
    })
    .get(`/api/runs/${ONGOING_RUN_NUMBER}${TOKEN_PATH}`)
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
