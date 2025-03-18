/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { config } from '../../config/configProvider.js';

const {
  host,
  port,
  username,
  password,
  database,
  charset,
  collate,
  timezone,
  logging,
} = config.database;

export default {
  dialect: 'mariadb',
  dialectOptions: {
    charset,
    collate,
    timezone,
  },
  host,
  port,
  username,
  password,
  database,
  logging,
};
