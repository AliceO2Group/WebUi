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
      id: '671b8c25d5b49dbf80e81926',
      object_name: 'qc/TPC/QO/CheckOfTrack_Trending',
      ignore_defaults: false,
    },
    {
      id: '671b8c256cdd70443c1cd709',
      object_name: 'qc/MCH/QO/DataDecodingCheck',
      ignore_defaults: false,
    },
    {
      id: '671b8c266dd77d73874f4e90',
      object_name: 'qc/MCH/QO/MFTRefCheck',
      ignore_defaults: false,
    },
    {
      id: '671b8c2bcc75ce6053c67874',
      object_name: 'qc/MCH/MO/Pedestals/ST5/DE1006/BadChannels_XY_B_1006',
      ignore_defaults: false,
    },
    {
      id: '671b8c604deeb0f548863a8c',
      object_name: 'qc/MCH/MO/Pedestals/BadChannelsPerDE',
      ignore_defaults: false,
    },
    {
      id: '6724a6bd1b2bad3d713cc4ee',
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
