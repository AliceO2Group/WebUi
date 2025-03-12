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

import { suite, test, afterEach } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import { JsonFileService } from '../../../lib/services/JsonFileService.js';
import { config } from '../../config.js';


export const jsonFileServiceTestSuite = async () => {
  
  suite('JSON File Service Test Suite', () => {
    
    afterEach(() => {
      if (fs.existsSync(config.dbFile)) {
        fs.unlinkSync(config.dbFile);
      }
    });

    afterEach(() => {
      fs.writeFileSync(config.dbFile, JSON.stringify({ layouts: [], users: [] }));
  });

    test('should reject when layouts are missing from data with error of bad data format', async () => {
      fs.writeFileSync(config.dbFile, JSON.stringify({ users: [] }));
      const service = new JsonFileService(config.dbFile);
      await assert.rejects(
        service.ready,
        (err) => {
            return err instanceof Error && err.message === `DB file should have an array of layouts ${config.dbFile.split('./')[1]}`;
        }
      );
    });

    test('should reject when there is no data with error of bad data format', async () => {
      fs.writeFileSync(config.dbFile, '');
      const service = new JsonFileService(config.dbFile);
      await assert.rejects(
        service.ready,
        (err) => {
          return err instanceof Error && err.message === `Unable to parse DB file ${config.dbFile.split('./')[1]}`;
        }
      );
    });

    test('should reject when data.layouts is not an Array with error of bad data format', async () => {
      fs.writeFileSync(config.dbFile, JSON.stringify({ layouts: {}, users: [] }));
      const service = new JsonFileService(config.dbFile);
      await assert.rejects(
        service.ready,
        (err) => {
          return err instanceof Error && err.message === `DB file should have an array of layouts ${config.dbFile.split('./')[1]}`;
        }
      );
    });

    test('should resolve and add an array of users if missing from data', async () => {
      fs.writeFileSync(config.dbFile, JSON.stringify({ layouts: [] }));
      const service = new JsonFileService(config.dbFile);
      await service.ready;
      assert.deepStrictEqual(service.data, { layouts: [], users: [] });
    });

    test('should successfully read layouts from data', async () => {
      const layouts = [{ id: '1', name: 'Layout 1' }, { id: '2', name: 'Layout 2' }];
      fs.writeFileSync(config.dbFile, JSON.stringify({ layouts, users: [] }));
      const service = new JsonFileService(config.dbFile);
      await service.ready;
      assert.deepStrictEqual(service.data.layouts, layouts);
    });

    test('should reject when there is missing data with error of bad JSON format', async () => {
      fs.writeFileSync(config.dbFile, '{layouts: [}');
      const service = new JsonFileService(config.dbFile);
      await assert.rejects(
        service.ready,
        (err) => {
          return err instanceof Error && err.message === `Unable to parse DB file ${config.dbFile.split('./')[1]}`;
        }
      );
    });







  });
};
