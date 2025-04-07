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

export const LAYOUT_INPUT_MOCK = {
  id: 'layout-123',
  name: 'layout-name',
  owner: {
    id: '123',
    name: 'Jane Doe',
  },
  description: 'layout-desc',
  display_timestamp: true,
  auto_tab_change_interval: 30,
  tabs: [
    {
      id: 'tab-1',
      name: 'Q1 Overview',
      column_count: 3,
      gridTabCells: [
        {
          row: 0,
          col: 0,
          row_span: 2,
          col_span: 2,
          chart: {
            id: 'chart-1',
            object_name: 'chart-1-test',
            ignore_defaults: false,
            chartOptions: [
              {
                option: {
                  id: 'opt-1',
                  name: 'Color Scheme',
                  type: 'string',
                },
              },
              {
                option: {
                  id: 'opt-2',
                  name: 'Show Legend',
                  type: 'boolean',
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

export const INCORRECT_LAYOUT_INPUT_MOCK = {
  badField: 'badValue',
};

export const LAYOUT_ADAPTED_MOCK = {
  id: 'layout-123',
  name: 'layout-name',
  owner_id: '123',
  owner_name: 'Jane Doe',
  description: 'layout-desc',
  displayTimestamp: true,
  autoTabChange: 30,
  tabs: [
    {
      id: 'tab-1',
      name: 'Q1 Overview',
      columns: 3,
      objects: [
        {
          id: 'chart-1',
          x: 0,
          y: 0,
          h: 2,
          w: 2,
          name: 'chart-1-test',
          options: ['Color Scheme', 'Show Legend'],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
    },
  ],
  collaborators: [],
};
