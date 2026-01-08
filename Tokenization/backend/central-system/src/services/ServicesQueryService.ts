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
import type {
  ServiceListItemDto,
  ServiceListQueryFilters,
  ServiceRow,
} from '../types/query_types';
import {
  buildServiceOrder,
  buildServiceWhere,
  mapServiceRowToDto,
} from '../lib/database/utils/queryHelpersServices.js';

// Service for querying services from the database.
export class ServicesQueryService {
  /**
   * Get a list of services from the database based on the provided filters.
   * @param db - The SequelizeDatabase instance.
   * @param filters - The filters to apply to the query.
   * @returns A promise that resolves to an array of ServiceListItemDto.
   * @throws Will throw an error if the database query fails.
   */
  public async getServices(
    db: SequelizeDatabase,
    filters: ServiceListQueryFilters
  ): Promise<ServiceListItemDto[]> {
    try {
      const where = buildServiceWhere(filters);
      const order = buildServiceOrder(filters.ordering);

      const rows = await db.models.Service.findAll({
        where,
        order: order.length ? order : [['name', 'ASC']],
        raw: true,
      });

      const typedRows = rows as unknown as ServiceRow[];
      return typedRows.map(mapServiceRowToDto);
    } catch (err) {
      console.error('[ServicesQueryService.getServices] DB query failed:', err);
      throw err;
    }
  }

  /**
   * Get a single service by its ID.
   * @param db - The SequelizeDatabase instance.
   * @param id - The ID of the service to retrieve.
   * @returns A promise that resolves to a ServiceListItemDto or null if not found.
   * @throws Will throw an error if the database query fails.
   */
  public async getServiceById(
    db: SequelizeDatabase,
    id: number
  ): Promise<ServiceListItemDto | null> {
    try {
      const row = await db.models.Service.findByPk(id, { raw: true });
      const typedRow = row as unknown as ServiceRow | null;
      return typedRow ? mapServiceRowToDto(typedRow) : null;
    } catch (err) {
      console.error(
        '[ServicesQueryService.getServiceById] DB query failed:',
        err
      );
      throw err;
    }
  }
}
