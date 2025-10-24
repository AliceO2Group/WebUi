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

export const LAYOUT_MOCK_1 = {
  id: 'mylayout',
  name: 'something',
  tabs: [{ name: 'tab', id: '1' }],
  owner_id: 1,
  owner_name: 'one',
};

export const LAYOUT_MOCK_2 = {
  autoTabChange: 0,
  collaborators: [],
  description: '',
  displayTimestamp: false,
  id: '671b8c22402408122e2f20dd',
  name: 'test',
  owner_id: 0,
  owner_name: 'Anonymous',
  tabs: [
    {
      columns: 2,
      id: 'test',
      name: 'test',
      objects: [],
    },
  ],
};

export const LAYOUT_MOCK_3 = {
  autoTabChange: 0,
  collaborators: [],
  description: '',
  displayTimestamp: false,
  id: '671b8c22402408122e2f20dd',
  name: 'a-test',
  owner_id: 0,
  owner_name: 'Anonymous',
  tabs: [
    {
      columns: 2,
      id: 'test',
      name: 'test',
      objects: [],
    },
  ],
};

export const LAYOUT_MOCK_4 = {
  id: '671b8c22402408122e2f20dd',
  name: 'test',
  owner_id: 0,
  owner_name: 'Anonymous',
  description: '',
  displayTimestamp: false,
  autoTabChange: 0,
  tabs: [
    {
      id: '671b8c227b3227b0c603c29d',
      name: 'main',
      objects: [
        {
          id: '671b8c25d5b49dbf80e81926',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/QO/Aggregator/MCHQuality',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '671b8c256cdd70443c1cd709',
          x: 1,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/QO/DataDecodingCheck',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '671b8c266dd77d73874f4e90',
          x: 2,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/QO/MFTRefCheck',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '671b8c2bcc75ce6053c67874',
          x: 0,
          y: 1,
          h: 1,
          w: 1,
          name: 'qc/MCH/MO/Pedestals/ST5/DE1006/BadChannels_XY_B_1006',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
      columns: 2,
    },
    {
      id: '671b8c5aa66868891b977311',
      name: 'test-tab',
      objects: [
        {
          id: '671b8c604deeb0f548863a8c',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/MO/Pedestals/BadChannelsPerDE',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
      columns: 3,
    },
  ],
  collaborators: [],
};

export const LAYOUT_MOCK_5 = {
  id: '671b95883d23cd0d67bdc787',
  name: 'a-test',
  owner_id: 0,
  owner_name: 'Anonymous',
  description: '',
  displayTimestamp: false,
  autoTabChange: 0,
  tabs: [
    {
      id: '671b95884312f03458f1d9ca',
      name: 'main',
      objects: [
        {
          id: '6724a6bd1b2bad3d713cc4ee',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/test/object/1',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '6724a6bd1b2bad3d713cc4ee',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/test/object/1',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
      columns: 2,
    },
    {
      id: '671b958b8a5cfb52ee9ef2a1',
      name: 'a',
      objects: [],
      columns: 2,
    },
  ],
  collaborators: [],
};

export const LAYOUT_MOCK_6 = {
  id: '671b8c22402408122e2f20dd',
  name: 'test',
  owner_id: 0,
  owner_name: 'Anonymous',
  description: '',
  displayTimestamp: false,
  autoTabChange: 0,
  tabs: [
    {
      id: '671b8c227b3227b0c603c29d',
      name: 'main',
      objects: [
        {
          id: '671b8c25d5b49dbf80e81926',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/QO/Aggregator/MCHQuality',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '671b8c256cdd70443c1cd709',
          x: 1,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/QO/DataDecodingCheck',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '671b8c266dd77d73874f4e90',
          x: 2,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/QO/MFTRefCheck',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: '671b8c2bcc75ce6053c67874',
          x: 0,
          y: 1,
          h: 1,
          w: 1,
          name: 'qc/MCH/MO/Pedestals/ST5/DE1006/BadChannels_XY_B_1006',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
      columns: 2,
    },
    {
      id: '671b8c5aa66868891b977311',
      name: 'test-tab',
      objects: [
        {
          id: '671b8c604deeb0f548863a8c',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/MCH/MO/Pedestals/BadChannelsPerDE',
          options: [],
          autoSize: false,
          ignoreDefaults: false,
        },
      ],
      columns: 3,
    },
  ],
  collaborators: [],
};

// Mocks for LayoutController tests
export const LAYOUT_CONTROLLER_MOCK_1 = {
  id: 10001,
  name: 'Test Layout 1',
  owner: { id: 123, name: 'Owner 1' },
  tabs: [{ id: 1, name: 'Tab 1', gridTabCells: [] }],
  is_official: true,
};

export const LAYOUT_CONTROLLER_MOCK_2 = {
  id: 10002,
  name: 'Test Layout 2',
  owner: { id: 123, name: 'Owner 1' },
  tabs: [{ id: 1, name: 'Tab 1', gridTabCells: [] }],
  is_official: true,
};

//Mocks for mapLayoutToAPI tests
export const RAW_LAYOUT_MOCK = {
  id: 10003,
  name: 'Raw Layout',
  owner: { id: 456, name: 'Owner 2' },
  description: 'A raw layout for testing',
  display_timestamp: true,
  auto_tab_change_interval: 30,
  tabs: [
    {
      id: 1,
      name: 'Tab 1',
      column_count: 3,
      gridTabCells: [
        {
          row: 0,
          col: 0,
          row_span: 1,
          col_span: 1,
          chart: {
            id: 2001,
            object_name: 'Chart 1',
            chartOptions: [{ option: { name: 'Option A' } }, { option: { name: 'Option B' } }],
            ignore_defaults: false,
          },
        },
        {
          row: 0,
          col: 1,
          row_span: 2,
          col_span: 2,
          chart: {
            id: 2002,
            object_name: 'Chart 2',
            chartOptions: [{ option: { name: 'Option C' } }],
            ignore_defaults: true,
          },
        },
      ],
    },
  ],
  is_official: false,
};

export const API_ADAPTED_LAYOUT_MOCK = {
  id: 10003,
  name: 'Raw Layout',
  owner_id: 456,
  owner_name: 'Owner 2',
  description: 'A raw layout for testing',
  displayTimestamp: true,
  autoTabChange: 30,
  tabs: [
    {
      id: 1,
      name: 'Tab 1',
      columns: 3,
      objects: [
        {
          id: 2001,
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'Chart 1',
          options: ['Option A', 'Option B'],
          autoSize: false,
          ignoreDefaults: false,
        },
        {
          id: 2002,
          x: 1,
          y: 0,
          h: 2,
          w: 2,
          name: 'Chart 2',
          options: ['Option C'],
          autoSize: false,
          ignoreDefaults: true,
        },
      ],
    },
  ],
  isOfficial: false,
  collaborators: [],
};
export const MOCK_GET_LAYOUTS_ALL = [
  {
    id: 1,
    name: 'test',
    owner_id: 0,
    owner_name: 'Anonymous',
    description: '',
    displayTimestamp: false,
    autoTabChange: 0,
    tabs: [
      {
        id: 1,
        name: 'main',
        columns: 2,
        objects: [
          {
            id: 1,
            x: 0,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/TPC/QO/CheckOfTrack_Trending',
            options: [
              'lego',
              'colz',
            ],
            autoSize: false,
            ignoreDefaults: false,
          },
          {
            id: 2,
            x: 1,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/MCH/QO/DataDecodingCheck',
            options: ['lego'],
            autoSize: false,
            ignoreDefaults: false,
          },
          {
            id: 3,
            x: 2,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/MCH/QO/MFTRefCheck',
            options: ['lcolz'],
            autoSize: false,
            ignoreDefaults: false,
          },
          {
            id: 4,
            x: 0,
            y: 1,
            h: 1,
            w: 1,
            name: 'qc/MCH/MO/Pedestals/ST5/DE1006/BadChannels_XY_B_1006',
            options: ['text'],
            autoSize: false,
            ignoreDefaults: false,
          },
        ],
      },
      {
        id: 2,
        name: 'test-tab',
        columns: 3,
        objects: [
          {
            id: 5,
            x: 0,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/MCH/MO/Pedestals/BadChannelsPerDE',
            options: [
              'logx',
              'logy',
            ],
            autoSize: false,
            ignoreDefaults: false,
          },
        ],
      },
    ],
    isOfficial: false,
    collaborators: [],
  },
  {
    id: 2,
    name: 'a-test',
    owner_id: 0,
    owner_name: 'Anonymous',
    description: '',
    displayTimestamp: false,
    autoTabChange: 0,
    tabs: [
      {
        id: 3,
        name: 'main',
        columns: 2,
        objects: [
          {
            id: 6,
            x: 0,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/test/object/1',
            options: ['logz'],
            autoSize: false,
            ignoreDefaults: false,
          },
        ],
      },
      {
        id: 4,
        name: 'a',
        columns: 2,
        objects: [],
      },
    ],
    isOfficial: false,
    collaborators: [],
  },
  {
    id: 3,
    name: 'rundefinition_pdpBeamType',
    owner_id: 99,
    owner_name: 'Some other owner',
    description: '',
    displayTimestamp: false,
    autoTabChange: 0,
    tabs: [
      {
        id: 5,
        name: 'main',
        columns: 2,
        objects: [
          {
            id: 7,
            x: 0,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/test/object/1',
            options: [],
            autoSize: false,
            ignoreDefaults: false,
          },
          {
            id: 8,
            x: 0,
            y: 0,
            h: 1,
            w: 1,
            name: 'qc/test/object/1',
            options: [],
            autoSize: false,
            ignoreDefaults: false,
          },
        ],
      },
      {
        id: 6,
        name: 'a',
        columns: 2,
        objects: [],
      },
    ],
    isOfficial: false,
    collaborators: [],
  },
];
export const MOCK_GET_LAYOUTS_BY_OWNER_ID = (ownerId) =>
  MOCK_GET_LAYOUTS_ALL.filter((layout) => layout.owner_id === ownerId);

export const MOCK_GET_ONLY_NAME_AND_OWNER_ID = MOCK_GET_LAYOUTS_ALL.map((layout) => ({
  name: layout.name,
  owner_id: layout.owner_id,
}));

export const [MOCK_GET_LAYOUT_1, MOCK_GET_LAYOUT_A_TEST, MOCK_GET_LAYOUT_RUN_DEF] = MOCK_GET_LAYOUTS_ALL;
export const MOCK_UPDATED_LAYOUT = { ...MOCK_GET_LAYOUTS_ALL[0], name: 'Updated Layout Name' };
