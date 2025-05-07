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

/**
 * Creates default options for drawing and display hints in the database.
 * @param {object} queryInterface - The Sequelize query interface.
 * @param {Sequelize} Sequelize - The Sequelize library.
 * @returns {Promise<void>} A promise that resolves when the options are created.
 */
export const up = async (queryInterface) => {
  const now = new Date();

  const drawingOptions = ['lego', 'colz', 'lcolz', 'text'].map((name) => ({
    name,
    type: 'Drawing Option',
    created_at: now,
    updated_at: now,
  }));

  const displayHints = ['logx', 'logy', 'logz', 'gridx', 'gridy', 'gridz', 'stat'].map((name) => ({
    name,
    type: 'Display Hint',
    created_at: now,
    updated_at: now,
  }));

  await queryInterface.bulkInsert('options', [...drawingOptions, ...displayHints]);
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.bulkDelete('options', {
    name: {
      [Sequelize.Op.in]: [
        'lego',
        'colz',
        'lcolz',
        'text',
        'logx',
        'logy',
        'logz',
        'gridx',
        'gridy',
        'gridz',
        'stat',
      ],
    },
  });
};
