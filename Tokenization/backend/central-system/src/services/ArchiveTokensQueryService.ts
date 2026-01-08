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

import { SequelizeDatabase } from '../lib/database/SequelizeDatabase.js';
import {
  TokenListItemDto,
  TokenListQueryFilters,
  TokenRow,
} from '../types/query_types';
import {
  buildTokenWhere,
  buildTokenOrder,
  mapTokenRowToDto,
} from '../lib/database/utils/queryHelpersTokens.js';

/** Service for querying archived tokens from the database.
 */
export class ArchiveTokensQueryService {
  /**
   * Get a list of archived tokens from the database based on the provided filters.
   * @param db The SequelizeDatabase instance to use for the query.
   * @param filters The filters to apply to the token query.
   * @returns A promise that resolves to an array of TokenListItemDto objects.
   * @throws Will throw an error if the database query fails.
   **/
  public async getTokens(
    db: SequelizeDatabase,
    filters: TokenListQueryFilters
  ): Promise<TokenListItemDto[]> {
    try {
      const where = buildTokenWhere(filters);
      const order = buildTokenOrder(filters.ordering);

      const rows = await db.models.ArchiveToken.findAll({
        where,
        order: order.length ? order : [['created_at', 'DESC']],
      });

      return rows.map(mapTokenRowToDto);
    } catch (err) {
      console.error(
        '[ArchiveTokensQueryService.getTokens] DB query failed:',
        err
      );
      throw err;
    }
  }

  /**
   * Get a single token by its ID.
   * @param db The SequelizeDatabase instance to use for the query.
   * @param id The ID of the token to retrieve.
   * @returns A promise that resolves to a TokenListItemDto object or null if not found.
   * @throws Will throw an error if the database query fails.
   **/
  public async getTokenById(
    db: SequelizeDatabase,
    id: number
  ): Promise<TokenListItemDto | null> {
    try {
      const row = (await db.models.ArchiveToken.findByPk(
        id
      )) as unknown as TokenRow | null;
      return row ? (mapTokenRowToDto(row) as TokenListItemDto) : null;
    } catch (err) {
      console.error(
        '[ArchiveTokensQueryService.getTokenById] DB query failed:',
        err
      );
      throw err;
    }
  }
}
