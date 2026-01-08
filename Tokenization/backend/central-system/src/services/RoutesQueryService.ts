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
import type {
  RoutesListQueryFilters,
  RouteListItemDto,
  RouteRow,
  CreateRouteDto,
  RoutePermissions,
  RoutesBulkDeleteQueryFilters,
} from '../types/query_types';

import {
  buildRoutesWhere,
  mapRouteRowToDto,
  resolveServiceSerial,
  resolveSerialsBulkDelete,
} from '../lib/database/utils/queryHelpersRoutes.js';
import { Op } from 'sequelize';

/** Service to query routes from the database. */
export class RoutesQueryService {
  /** Get a list of routes based on filters.
   * @param db - SequelizeDatabase instance.
   * @param filters - Filters to apply to the query.
   * @returns Promise resolving to an array of RouteListItemDto.
   * @throws Will throw an error if the database query fails.
   */
  public async getRoutes(
    db: SequelizeDatabase,
    filters: RoutesListQueryFilters
  ): Promise<RouteListItemDto[]> {
    try {
      const where = buildRoutesWhere(filters);

      const rows = await db.models.Route.findAll({
        where,
        raw: true,
      });

      const typedRows = rows as unknown as RouteRow[];
      return typedRows.map(mapRouteRowToDto);
    } catch (err) {
      console.error('[RoutesQueryService.getRoutes] DB query failed:', err);
      throw err;
    }
  }

  /** Create a new route between two services.
   * @param db - SequelizeDatabase instance.
   * @param serviceFromIdOrName - ID or name of the sender service.
   * @param serviceToIdOrName - ID or name of the receiver service.
   * @param permissions - Permissions for the route.
   * @returns Promise resolving to the created route as CreateRouteDto.
   * @throws Will throw an error if the database operation fails.
   */
  public async createRoute(
    db: SequelizeDatabase,
    serviceFromIdOrName: string,
    serviceToIdOrName: string,
    permissions: RoutePermissions
  ): Promise<CreateRouteDto> {
    try {
      return await db.sequelize.transaction(async (t: any) => {
        const senderSerial = await resolveServiceSerial(
          db,
          serviceFromIdOrName
        );
        const receiverSerial = await resolveServiceSerial(
          db,
          serviceToIdOrName
        );

        if (!senderSerial || !receiverSerial) {
          const err = new Error('Invalid serviceFrom or serviceTo');
          (err as any).code = 'INVALID_SERVICES';
          throw err;
        }

        const existing = await db.models.Route.findOne({
          where: {
            sender_serial_number: senderSerial,
            receiver_serial_number: receiverSerial,
          },
          attributes: ['id'],
          transaction: t,
          raw: true,
        });

        if (existing) {
          const err = new Error('Route already exists');
          (err as any).code = 'ROUTE_EXISTS';
          throw err;
        }

        const created = await db.models.Route.create(
          {
            sender_serial_number: senderSerial,
            receiver_serial_number: receiverSerial,
            permissions,
            status: 'active',
          },
          { transaction: t }
        );

        const row = created.get({ plain: true }) as unknown as RouteRow;

        return {
          id: row.id,
          serviceFrom: row.sender_serial_number,
          serviceTo: row.receiver_serial_number,
          permissions: row.permissions,
        };
      });
    } catch (err) {
      console.error(
        '[RoutesCommandService.createRoute] DB operation failed:',
        err
      );
      throw err;
    }
  }

  /** Delete a route by its ID.
   * @param db - SequelizeDatabase instance.
   * @param routeId - ID of the route to delete.
   * @returns Promise resolving to void.
   * @throws Will throw an error if the database operation fails.
   */
  public async deleteRouteById(
    db: SequelizeDatabase,
    routeId: number
  ): Promise<void> {
    try {
      await db.models.Route.destroy({
        where: { id: routeId },
      });
    } catch (err) {
      console.error(
        '[RoutesCommandService.deleteRouteById] DB operation failed:',
        err
      );
      throw err;
    }
  }

  /** Delete routes based on bulk delete filters.
   * @param db - SequelizeDatabase instance.
   * @param filters - Filters to determine which routes to delete.
   * @returns Promise resolving to void.
   * @throws Will throw an error if the database operation fails.
   */
  public async deleteRoutes(
    db: SequelizeDatabase,
    filters: RoutesBulkDeleteQueryFilters
  ): Promise<void> {
    try {
      const fromValues = filters.serviceFrom ?? [];
      const toValues = filters.serviceTo ?? [];

      if (!fromValues.length && !toValues.length) return;

      const [fromSerials, toSerials] = await Promise.all([
        fromValues.length
          ? resolveSerialsBulkDelete(db, fromValues)
          : Promise.resolve([]),
        toValues.length
          ? resolveSerialsBulkDelete(db, toValues)
          : Promise.resolve([]),
      ]);

      if (!fromSerials.length && !toSerials.length) return;

      const or: object[] = [];
      if (fromSerials.length) {
        or.push({ sender_serial_number: { [Op.in]: fromSerials } });
      }
      if (toSerials.length) {
        or.push({ receiver_serial_number: { [Op.in]: toSerials } });
      }

      await db.models.Route.destroy({
        where: { [Op.or]: or } as any,
      });
    } catch (err) {
      console.error(
        '[RoutesCommandService.deleteRoutes] DB operation failed:',
        err
      );
      throw err;
    }
  }
}
