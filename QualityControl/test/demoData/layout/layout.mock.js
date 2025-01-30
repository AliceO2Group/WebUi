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
