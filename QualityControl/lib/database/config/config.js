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
import dotenv from 'dotenv';
dotenv.config();

const host = process.env?.DATABASE_HOST || 'qcg-database';
const port = process.env?.DATABASE_PORT || 3306;
const username = process.env?.DATABASE_USERNAME || 'qcg_dev_user';
const password = process.env?.DATABASE_PASSWORD || '123456';
const database = `${process.env?.DATABASE_NAME || 'qcg_dev_db'}`;
const charset = process.env?.DATABASE_CHARSET || 'utf8mb4';
const collate = process.env?.DATABASE_COLLATE || 'utf8mb4_unicode_ci';
const timezone = process.env?.DATABASE_TIMEZONE || 'Etc/GMT+2';
const logging = process.env?.DATABASE_LOGGING?.toLowerCase() === 'true';
const dialect = 'mariadb';

export default {
  dialect,
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
