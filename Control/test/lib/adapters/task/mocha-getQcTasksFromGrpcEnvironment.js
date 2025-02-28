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
const { getQcTasksFromGrpcEnvironment } = require('../../../../lib/adapters/task/getQcTasksFromGrpcEnvironment.js');

describe('getQcTasksFromGrpcEnvironment', () => {
  it('should return tasks that are being ran on the QC nodes', () => {
    const environmentInfo = {
      tasks: [
        { deploymentInfo: { hostname: 'alio2-cr1-qc01' } },
        { deploymentInfo: { hostname: 'host1' } },
        { deploymentInfo: { hostname: 'alio2-cr1-qc02' } },
      ],
    };

    deepStrictEqual(getQcTasksFromGrpcEnvironment(environmentInfo), [
      { deploymentInfo: { hostname: 'alio2-cr1-qc01' } },
      { deploymentInfo: { hostname: 'alio2-cr1-qc02' } },
    ]);
  });

  it('should return an empty array if no tasks match the QC node regex', () => {
    const environmentInfo = {
      tasks: [
        { deploymentInfo: { hostname: 'host1' } },
        { deploymentInfo: { hostname: 'host2' } },
      ],
    };

    deepStrictEqual(getQcTasksFromGrpcEnvironment(environmentInfo), []);
  });

  it('should handle tasks with missing deploymentInfo or hostname', () => {
    const environmentInfo = {
      tasks: [
        { deploymentInfo: { hostname: 'alio2-cr1-qc01' } },
        { deploymentInfo: {} },
        {},
      ],
    };

    deepStrictEqual(getQcTasksFromGrpcEnvironment(environmentInfo), [{ deploymentInfo: { hostname: 'alio2-cr1-qc01' } }]);
  });

  it('should handle an empty tasks array', () => {
    const environmentInfo = {
      tasks: [],
    };

    deepStrictEqual(getQcTasksFromGrpcEnvironment(environmentInfo), []);
  });

  it('should handle an undefined tasks array', () => {
    const environmentInfo = {};

    deepStrictEqual(getQcTasksFromGrpcEnvironment(environmentInfo), []);
  });
});
