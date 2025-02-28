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
const { getEpnTasksFromGrpcEnvironment } = require('../../../../lib/adapters/task/getEpnTasksFromGrpcEnvironment.js');

describe('getEpnTasksFromGrpcEnvironment', () => {
  it('should return tasks that are being ran on the EPN nodes', () => {
    const environmentInfo = {
      integratedServicesData: {
        odc: JSON.stringify({
          devices: [
            { state: 'RUNNING', ecsState: 'ACTIVE', id: 'alio2-epn-1' },
            { state: 'ERROR', ecsState: 'INACTIVE', id: 'alio2-epn-2' },
          ],
        }),
      },
    };

    deepStrictEqual(getEpnTasksFromGrpcEnvironment(environmentInfo), [
      { epnState: 'RUNNING', state: 'ACTIVE', id: 'alio2-epn-1' },
      { epnState: 'ERROR', state: 'INACTIVE', id: 'alio2-epn-2' },
    ]);
  });

  it('should return an empty array if no devices are present', () => {
    const environmentInfo = {
      integratedServicesData: {
        odc: JSON.stringify({ devices: [] }),
      },
    };

    deepStrictEqual(getEpnTasksFromGrpcEnvironment(environmentInfo), []);
  });

  it('should handle missing integratedServicesData', () => {
    deepStrictEqual(getEpnTasksFromGrpcEnvironment({}), []);
  });

  it('should handle return an empty array for invalid JSON in odc', () => {
    const environmentInfo = {
      integratedServicesData: {
        odc: 'invalid JSON',
      },
    };

    deepStrictEqual(getEpnTasksFromGrpcEnvironment(environmentInfo), []);
  });
});
