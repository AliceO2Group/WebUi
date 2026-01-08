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

/** * Service for querying tokens from the database.
 */
export class TokensQueryService {
  /**
   * Get a list of tokens from the database based on the provided filters.
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

      const rows = await db.models.Token.findAll({
        where,
        order: order.length ? order : [['created_at', 'DESC']],
      });

      return rows.map(mapTokenRowToDto);
    } catch (err) {
      console.error('[TokenQueryService.getTokens] DB query failed:', err);
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
      const row = (await db.models.Token.findByPk(
        id
      )) as unknown as TokenRow | null;
      return row ? (mapTokenRowToDto(row) as TokenListItemDto) : null;
    } catch (err) {
      console.error('[TokensQueryService.getTokenById] DB query failed:', err);
      throw err;
    }
  }

  /** Disable tokens matching the provided filters by archiving them.
   * @param db The SequelizeDatabase instance to use for the operation.
   * @param filters The filters to apply to select tokens for disabling.
   * @returns A promise that resolves to the number of tokens disabled.
   * @throws Will throw an error if the database operation fails.
   **/
  public async disableTokens(
    db: SequelizeDatabase,
    filters: TokenListQueryFilters
  ): Promise<number> {
    try {
      const where = buildTokenWhere(filters);

      const affected = await db.sequelize.transaction(async (t: any) => {
        const rows = (await db.models.Token.findAll({
          where,
          transaction: t,
        })) as unknown as TokenRow[];

        if (!rows.length) return 0;

        const archiveRows = rows.map((r: any) => ({
          audience: r.audience,
          subject: r.subject,
          token_object: r.token_object,
          created_at: r.created_at,
          updated_at: r.updated_at,
        }));

        await db.models.ArchiveToken.bulkCreate(archiveRows as any[], {
          transaction: t,
        });

        const ids = rows.map((r) => r.id);

        await db.models.Token.destroy({
          where: { id: ids } as any,
          transaction: t,
        });

        return ids.length;
      });

      return affected;
    } catch (err) {
      console.error(
        '[TokensQueryService.disableTokens] DB operation failed:',
        err
      );
      throw err;
    }
  }

  /** Disable a single token by its ID by archiving it.
   * @param db The SequelizeDatabase instance to use for the operation.
   * @param id The ID of the token to disable.
   * @returns A promise that resolves to true if the token was disabled, false if not found.
   * @throws Will throw an error if the database operation fails.
   **/
  public async disableTokenById(
    db: SequelizeDatabase,
    id: number
  ): Promise<boolean> {
    try {
      const ok = await db.sequelize.transaction(async (t: any) => {
        const row = (await db.models.Token.findByPk(id, {
          transaction: t,
        })) as unknown as TokenRow | null;
        if (!row) return false;

        await db.models.ArchiveToken.create(
          {
            audience: row.audience,
            subject: row.subject,
            token_object: row.token_object,
            created_at: row.created_at,
            updated_at: row.updated_at,
          } as any,
          { transaction: t }
        );
        await db.models.Token.destroy({
          where: { id } as any,
          transaction: t,
        });

        return true;
      });

      return ok;
    } catch (err) {
      console.error(
        '[TokensQueryService.disableTokenById] DB operation failed:',
        err
      );
      throw err;
    }
  }
}
