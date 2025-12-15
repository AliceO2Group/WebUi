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

import { LogManager } from '@aliceo2/web-ui';
import ArchiveToken from './../models/ArchiveTokenModel.js';
import Token from './../models/TokenModel.js';
import { Sequelize } from 'sequelize';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | string;

const logger = LogManager.getLogger('database/utils/expireToken');

/**
 * Expires a token by archiving it and removing the specified method.
 * If it's the last method, the token is deleted entirely.
 * @param sequelize - Sequelize instance for database operations.
 * @param id - ID of the token to expire.
 * @param method - HTTP method to expire from the token.
 */
export default async (
  sequelize: Sequelize,
  id: number,
  method: Method
): Promise<void> => {
  const token: typeof Token | null = await Token.findByPk(id);
  if (!token) {
    logger.info('No such token in database.');
    return;
  }

  const { sub, aud, iss, iat, jti } = token.token_object;
  const methods: string[] = Object.keys(iat);

  await sequelize.transaction(async (tx) => {
    await ArchiveToken.create(
      {
        audience: token.audience,
        subject: token.subject,
        token_object: {
          sub,
          aud,
          iss,
          method,
          jti,
        },
      },
      { transaction: tx }
    );

    if (methods.length === 1) {
      await token.destroy({ transaction: tx });
      return;
    }

    const { [method]: _removed, ...newIat } = iat;
    token.token_object = { ...token.token_object, iat: newIat };
    await token.save({ transaction: tx });
  });
};
