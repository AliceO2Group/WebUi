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

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { doesNotThrow, ok } from 'assert';
import { config } from '../../config.js';

import { buildPublicConfig } from './../../../lib/config/publicConfigProvider.js';

export default async () => {
  const RELATIVE_CONF_LOCATION = '../../../public/config.js';
  it('should successfully create JS module with public configuration as export', () => {
    doesNotThrow(() => buildPublicConfig(config));
  });

  it('should successfully import QCG public configuration', async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const confExists = existsSync(join(__dirname, RELATIVE_CONF_LOCATION));
    ok(confExists, 'Public configuration file was not identified');
  });
};
