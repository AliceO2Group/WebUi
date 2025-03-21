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

export default function getDatabaseConfig(config) {
  const {
    port = 3306,
    username = 'cern',
    password = 'cern',
    database = `qcg${process.env.NODE_ENV === 'test' ? '_test' : ''}`,
    charset = 'utf8mb4',
    collate = 'utf8mb4_general_ci',
    timezone = '+00:00',
    logging = false,
    maxRetries = 5,
    retryThrottle = 5000,
  } = config?.database ?? {};

  const host = process?.env?.DATABASE_HOST ?? 'localhost';

  return {
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
    maxRetries,
    retryThrottle,
  };
}
