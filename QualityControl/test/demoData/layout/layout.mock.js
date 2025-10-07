/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

export const LAYOUT_FROM_BACKEND = {
  id: '671b8c22402408122e2f20dd',
  name: 'test',
  owner: {
    id: 0,
    name: 'Anonymous',
  },
  description: 'description',
  display_timestamp: false,
  auto_tab_change_interval: 0,
  is_official: true,
  collaborators: [],
  tabs: [
    {
      id: '671b8c227b3227b0c603c29d',
      name: 'main',
      column_count: 2,
      gridTabCells: [
        {
          chart: {
            id: '671b8c25d5b49dbf80e81926',
            object_name: 'qc/MCH/QO/Aggregator/MCHQuality',
            chartOptions: [
              { option: { name: 'option1' } },
              { option: { name: 'option2' } },
            ],
          },
          row: 1,
          col: 2,
          row_span: 3,
          col_span: 4,
        },
      ],
    },
  ],

};

export const LAYOUT_ADAPTED_FOR_FRONTEND_API = {
  id: '671b8c22402408122e2f20dd',
  name: 'test',
  owner_id: 0,
  owner_name: 'Anonymous',
  description: 'description',
  displayTimestamp: false,
  autoTabChange: 0,
  tabs: [
    {
      id: '671b8c227b3227b0c603c29d',
      name: 'main',
      objects: [
        {
          id: '671b8c25d5b49dbf80e81926',
          x: 2,
          y: 1,
          h: 3,
          w: 4,
          name: 'qc/MCH/QO/Aggregator/MCHQuality',
          options: ['option1', 'option2'],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
      columns: 2,
    },
  ],
  isOfficial: true,
  collaborators: [],
};

export const VALID_LAYOUT_FOR_UPDATE = {
  id: '671b95a8e4f3f70f2f5e4b1a',
  name: 'SYNTHETIC_proton-proton',
  owner_id: 0,
  owner_name: 'Anonymous',
  description: 'updated-description',
  displayTimestamp: false,
  autoTabChange: 0,
  tabs: [
    {
      id: '671b95a8f0e4f70f2f5e4b1b',
      name: 'main',
      columns: 2,
      objects: [],
    },
  ],
  collaborators: [],
};
