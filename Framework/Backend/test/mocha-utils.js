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
const assert = require('assert');
const { minifyCriteria } = require('../utils/minifyCriteria.js');

const filters = {
  timestamp: {
    since: '13:02:30',
    until: '13:02:40',
    $since: '2024-12-02T12:02:30.000Z',
    $until: '2024-12-02T12:02:40.000Z',
  },
  hostname: {
    match: 'aldaqecs01-v1',
    exclude: '',
    $match: 'aldaqecs01-v1',
    $exclude: null,
  },
  rolename: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  pid: {
    match: '50990',
    exclude: '',
    $match: '50990',
    $exclude: null,
  },
  username: {
    match: 'alicedaq',
    exclude: '',
    $match: 'alicedaq',
    $exclude: null,
  },
  system: {
    match: 'DAQ',
    exclude: '',
    $match: 'DAQ',
    $exclude: null,
  },
  facility: {
    match: 'runControl',
    exclude: '',
    $match: 'runControl',
    $exclude: null,
  },
  detector: {
    match: 'TPC',
    exclude: '',
    $match: 'TPC',
    $exclude: null,
  },
  partition: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  run: {
    match: '248023',
    exclude: '',
    $match: '248023',
    $exclude: null,
  },
  errcode: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  errline: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  errsource: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  message: {
    match: '',
    exclude: '',
    $match: null,
    $exclude: null,
  },
  severity: {
    in: 'I F',
    $in: [
      'I',
      'F',
    ],
  },
  level: {
    max: null,
    $max: null,
  },
};

const minifiedFilters = '{"timestamp":{"since":"13:02:30","until":"13:02:40"},"hostname":{"match":"aldaqecs01-v1"},' +
'"pid":{"match":"50990"},"username":{"match":"alicedaq"},"system":{"match":"DAQ"},"facility":{"match":"runControl"},' +
'"detector":{"match":"TPC"},"run":{"match":"248023"},"severity":{"in":"I F"}}';

describe('Utils - minifyCriteria()', () => {
  it('minifyCriteria() works as expected', (done) => {
    const criterias = minifyCriteria(filters);
    assert.strictEqual(JSON.stringify(criterias), minifiedFilters);
    done();
  });
});
