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

export const LAYOUT_MOCK_7 = {
  id: 'q12b8c22402408122e2f20dd',
  name: 'drawing-test',
  owner_id: 0,
  owner_name: 'Anonymous',
  description: '',
  displayTimestamp: false,
  autoTabChange: 0,
  tabs: [
    {
      id: 'b12b8c227b3227b0c603c29d',
      name: 'main',
      objects: [
        {
          id: 'b12b8c25d5b49dbf80e81926',
          x: 0,
          y: 0,
          h: 1,
          w: 1,
          name: 'qc/test/object/12',
          options: ['logx', 'text'],
          autoSize: false,
          ignoreDefaults: true,
        },
      ],
      columns: 1,
    },
  ],
  collaborators: [],
};
