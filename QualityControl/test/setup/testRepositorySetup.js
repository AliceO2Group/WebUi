/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import fs from 'fs';
import sinon from 'sinon';
import { LogManager } from '@aliceo2/web-ui';
import { config } from '../config.js';
import { copyMockDataFileToUse } from './testServerSetup.js';

export const initTest = async () => {
  await copyMockDataFileToUse();
  const jsonFile = config.dbFile;
  const _logger = LogManager.getLogger('TESTS');
  let mockedLayouts = [];

  try {
    if (fs.existsSync(jsonFile)) {
      const content = fs.readFileSync(jsonFile, 'utf8');
      try {
        const parsedContent = JSON.parse(content);
        if (parsedContent.layouts && parsedContent.users) {
          mockedLayouts = parsedContent;
        } else {
          throw new Error('Invalid JSON format: layouts or users property is missing');
        }
      } catch (parseError) {
        throw new Error(`Error parsing JSON file: ${parseError.message}`);
      }
    } else {
      throw new Error('JSON file for testing not found');
    }
  } catch (error) {
    _logger.errorMessage(error.message);
    throw error;
  }

  const mockedJsonFileService = {
    data: mockedLayouts,
    writeToFile: sinon.stub().resolves(),
  };

  return { mockedJsonFileService };
};
