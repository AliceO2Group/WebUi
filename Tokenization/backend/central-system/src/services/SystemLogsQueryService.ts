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

import type { SequelizeDatabase } from '../lib/database/SequelizeDatabase.js';
import type { SystemLogRow, TokenLogListItemDto } from '../types/query_types';
import { mapSystemLogRowToTokenLogDto } from '../lib/database/utils/queryHelpersLogs.js';

/** Service for querying system logs from the database.
 */
export class SystemLogsQueryService {
  /**
   * Get logs associated with a specific token ID.
   * @param db The SequelizeDatabase instance to use for the query.
   * @param tokenId The ID of the token whose logs are to be retrieved.
   * @returns A promise that resolves to an array of TokenLogListItemDto objects.
   * @throws Will throw an error if the database query fails.
   **/
  public async getTokenLogs(
    db: SequelizeDatabase,
    tokenId: string
  ): Promise<TokenLogListItemDto[]> {
    try {
      const rows = await db.models.SystemLog.findAll({
        where: { token_id: tokenId },
        attributes: ['id', 'event', 'timestamp'],
        order: [['timestamp', 'DESC']],
        raw: true,
      });
      const typedRows = rows as unknown as SystemLogRow[];

      return typedRows.map(mapSystemLogRowToTokenLogDto);
    } catch (err) {
      console.error(
        '[SystemLogsQueryService.getTokenLogs] DB query failed:',
        err
      );
      throw err;
    }
  }
}
