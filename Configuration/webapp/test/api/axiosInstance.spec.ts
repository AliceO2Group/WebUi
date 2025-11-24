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

import assert from 'assert';

const BAD_REQUEST_ERROR_CODE = "ERR_BAD_REQUEST";

//test Configuration/webapp/app/api/axiosInstance.ts
import axiosInstance, { API_URL } from '../../app/api/axiosInstance';

describe('axios instance', function () {
  this.timeout(20000);

  it('should make a GET request and receive a response', async function () {
    const response = await axiosInstance.get(`${API_URL}/configurations`);
    assert.strictEqual(response.status, 200);
  });

  it('should handle error response correctly', async function () {
    try {
      await axiosInstance.get(`${API_URL}/not-existing`);
    } catch (error: unknown) {
      assert.strictEqual(error.code, BAD_REQUEST_ERROR_CODE);
    }
  });
});
