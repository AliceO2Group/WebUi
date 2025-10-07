/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

'use strict';

export const up = async (queryInterface) => {
  await queryInterface.bulkInsert('charts', [
    {
      id: 1,
      object_name: 'qc/TPC/QO/CheckOfTrack_Trending',
      ignore_defaults: false,
    },
    {
      id: 2,
      object_name: 'qc/MCH/QO/DataDecodingCheck',
      ignore_defaults: false,
    },
    {
      id: 3,
      object_name: 'qc/MCH/QO/MFTRefCheck',
      ignore_defaults: false,
    },
    {
      id: 4,
      object_name: 'qc/MCH/MO/Pedestals/ST5/DE1006/BadChannels_XY_B_1006',
      ignore_defaults: false,
    },
    {
      id: 5,
      object_name: 'qc/MCH/MO/Pedestals/BadChannelsPerDE',
      ignore_defaults: false,
    },
    {
      id: 6,
      object_name: 'qc/test/object/1',
      ignore_defaults: false,
    },
  ], {});
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.bulkDelete('charts', null, { transaction });
  });
};
