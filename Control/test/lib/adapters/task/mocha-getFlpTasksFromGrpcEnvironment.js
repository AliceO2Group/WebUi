/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const { deepStrictEqual } = require('assert');
const { getFlpTasksFromGrpcEnvironment } = require('../../../../lib/adapters/task/getFlpTasksFromGrpcEnvironment.js');

describe('getFlpTasksFromGrpcEnvironment', () => {
  it('should return tasks that are being ran on the FLP nodes', () => {
    const environmentInfo = {
      tasks: [
        { deploymentInfo: { hostname: 'host1' } },
        { deploymentInfo: { hostname: 'alio2-cr1-qc01' } },
        { deploymentInfo: { hostname: 'host2' } },
      ],
      includedDetectors: ['detector1', 'detector2'],
    };

    const hostsByDetector = new Map([
      ['detector1', ['host1', 'host3']],
      ['detector2', ['host2', 'host4']],
    ]);

    const result = getFlpTasksFromGrpcEnvironment(environmentInfo, hostsByDetector);
    deepStrictEqual(result, [
      { deploymentInfo: { hostname: 'host1' } },
      { deploymentInfo: { hostname: 'host2' } },
    ]);
  });

  it('should return an empty array if no tasks match the criteria', () => {
    const environmentInfo = {
      tasks: [
        { deploymentInfo: { hostname: 'alio2-cr1-qc01' } },
        { deploymentInfo: { hostname: 'alio2-cr1-qc02' } },
      ],
      includedDetectors: ['detector1', 'detector2'],
    };

    const hostsByDetector = new Map([
      ['detector1', ['host1', 'host3']],
      ['detector2', ['host2', 'host4']],
    ]);

    const result = getFlpTasksFromGrpcEnvironment(environmentInfo, hostsByDetector);

    deepStrictEqual(result, []);
  });

  it('should handle tasks with missing deploymentInfo or hostname', () => {
    const environmentInfo = {
      tasks: [
        { deploymentInfo: { hostname: 'host1' } },
        { deploymentInfo: {} },
        {},
      ],
      includedDetectors: ['detector1', 'detector2'],
    };

    const hostsByDetector = new Map([
      ['detector1', ['host1', 'host3']],
      ['detector2', ['host2', 'host4']],
    ]);

    const result = getFlpTasksFromGrpcEnvironment(environmentInfo, hostsByDetector);

    deepStrictEqual(result, [{ deploymentInfo: { hostname: 'host1' } }]);
  });
});
