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

import { strictEqual, rejects } from 'node:assert';
import { suite, test } from 'node:test';
import { stub, restore } from 'sinon';
import { RunNumberDto } from '../../../../lib/dtos/filters/RunNumberDto.js';
import { validateRunNumber } from '../../../../lib/middleware/helpers/validateRunNumber.js';
import { InvalidInputError } from '@aliceo2/web-ui';

/**
 * Tests for the validateRunNumber helper
 */
export const validateRunNumberTestSuite = async () => {
  suite('validateRunNumber', () => {
    test('should return parsed run number for valid string input', async () => {
      stub(RunNumberDto, 'validateAsync').resolves();

      const result = await validateRunNumber('123');

      strictEqual(result, 123);
      restore();
    });

    test('should return parsed run number for valid number input', async () => {
      stub(RunNumberDto, 'validateAsync').resolves();

      const result = await validateRunNumber(456);

      strictEqual(result, 456);
      restore();
    });

    test('should throw InvalidInputError when run number is undefined', async () => {
      await rejects(
        () => validateRunNumber(undefined),
        new InvalidInputError('Run number is required'),
      );
    });

    test('should throw InvalidInputError when Joi validation fails', async () => {
      await rejects(
        () => validateRunNumber('invalid'),
        new InvalidInputError('Run number must be a number'),

      );

      restore();
    });

    test('should parse string numbers correctly', async () => {
      const result = await validateRunNumber('789');

      strictEqual(result, 789);
      strictEqual(typeof result, 'number');
      restore();
    });

    test('should handle zero as valid run number', async () => {
      const result = await validateRunNumber('0');

      strictEqual(result, 0);
      restore();
    });

    test('should throw InvalidInputError for negative numbers', async () => {
      await rejects(
        () => validateRunNumber('-123'),
        new InvalidInputError('Run number must be positive'),
      );
    });
  });
};
