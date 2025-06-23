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

import { stub } from 'sinon';
import { ok } from 'node:assert';
import { suite, test, beforeEach } from 'node:test';
import { errorHandler } from '../../../lib/utils/errorHandler.js';

export const errorHandlerTestSuite = async () => {
  suite('Check errors are handled and sent successfully', () => {
    let res = null;
    beforeEach(() => {
      res = {
        status: stub().returnsThis(),
        send: stub(),
      };
    });

    test('should successfully respond with built error message when there is a message and no status', () => {
      errorHandler('Error', 'Error', res);
      ok(res.status.calledOnce);
    });

    test('should successfully respond with built error message and status > 500', () => {
      errorHandler('Error', 'Error', res, 502);
      ok(res.status.calledWith(502));
    });

    test('should successfully respond with built error message and status < 500', () => {
      errorHandler('Error', 'Error', res, 404);
      ok(res.status.calledWith(404));
    });

    test('should successfully respond with built error.message and status', () => {
      const err = {
        message: 'Test Error',
        stack: 'Some Stack',
      };
      errorHandler(err, 'Error To Send', res, 502);
      ok(res.status.calledWith(502));
      ok(res.send.calledWith({ message: 'Error To Send' }));
    });

    test('should successfully respond with built error.message, no stack and status', () => {
      const err = 'Test Error';
      errorHandler(err, 'Error To Send', res, 404);
      ok(res.status.calledWith(404));
      ok(res.send.calledWith({ message: 'Error To Send' }));
    });
  });
};
