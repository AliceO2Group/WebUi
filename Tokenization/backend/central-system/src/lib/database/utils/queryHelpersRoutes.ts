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

import { Op } from 'sequelize';
import type { WhereOptions } from 'sequelize';

import type {
  RouteListItemDto,
  RouteRow,
  RoutesListQueryFilters,
  RoutePermissions,
  ServiceRow,
  RoutesBulkDeleteQueryRaw,
  RoutesBulkDeleteQueryFilters,
  ServiceSerialRow,
} from '../../../types/query_types';

import type { SequelizeDatabase } from '../SequelizeDatabase.js';

// Parse query parameters
const toStringArray = (v: unknown): string[] | undefined => {
  if (v === undefined || v === null || v === '') return undefined;

  if (Array.isArray(v)) {
    const out = v
      .flatMap((x) => String(x).split(','))
      .map((s) => s.trim())
      .filter(Boolean);
    return out.length ? out : undefined;
  }

  const out = String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return out.length ? out : undefined;
};

export type RoutesListQueryRaw = {
  serviceFrom?: string | string[];
  serviceTo?: string | string[];
};

export function parseRoutesListFilters(
  query: RoutesListQueryRaw
): RoutesListQueryFilters {
  return {
    serviceFrom: toStringArray(query.serviceFrom),
    serviceTo: toStringArray(query.serviceTo),
  };
}

// Build Sequelize WHERE clause from filters

export function buildRoutesWhere(
  filters: RoutesListQueryFilters
): WhereOptions {
  const where: WhereOptions = {};

  if (filters.serviceFrom?.length) {
    (where as any).sender_serial_number = { [Op.in]: filters.serviceFrom };
  }

  if (filters.serviceTo?.length) {
    (where as any).receiver_serial_number = { [Op.in]: filters.serviceTo };
  }

  return where;
}

// Mapper from RouteRow to RouteListItemDto

export function mapRouteRowToDto(row: RouteRow): RouteListItemDto {
  return {
    id: row.id,
    serviceFrom: row.sender_serial_number,
    serviceTo: row.receiver_serial_number,
    permissions: row.permissions,
  };
}

// Validators and normalizers
export function isRoutePermissions(v: unknown): v is RoutePermissions {
  if (v === null || typeof v !== 'object') return false;

  const obj = v as Record<string, unknown>;
  const allowed = new Set(['GET', 'POST', 'PUT', 'DELETE']);

  for (const [k, val] of Object.entries(obj)) {
    if (!allowed.has(k)) return false;
    if (typeof val !== 'number' || !Number.isFinite(val)) return false;
  }

  return true;
}

// Normalize ID or name input
export function normalizeIdOrName(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// Resolve service serial number from ID or name
export async function resolveServiceSerial(
  db: SequelizeDatabase,
  idOrName: string
): Promise<string | null> {
  const asNumber = Number(idOrName);
  const where =
    Number.isInteger(asNumber) && asNumber > 0
      ? ({ id: asNumber } as const)
      : ({
          [Op.or]: [{ name: idOrName }, { serial_number: idOrName }],
        } as const);

  const row = await db.models.Service.findOne({
    where,
    attributes: ['id', 'name', 'serial_number'],
    raw: true,
  });

  const svc = row as unknown as ServiceRow | null;
  return svc ? svc.serial_number : null;
}

export async function resolveSerialsBulkDelete(
  db: SequelizeDatabase,
  values: string[]
): Promise<string[]> {
  if (!values.length) return [];

  const ids: number[] = [];
  const namesOrSerials: string[] = [];

  for (const v of values) {
    const n = Number(v);
    if (Number.isInteger(n) && n > 0) ids.push(n);
    else namesOrSerials.push(v);
  }

  const where =
    ids.length && namesOrSerials.length
      ? ({
          [Op.or]: [
            { id: { [Op.in]: ids } },
            { name: { [Op.in]: namesOrSerials } },
            { serial_number: { [Op.in]: namesOrSerials } },
          ],
        } as const)
      : ids.length
      ? ({ id: { [Op.in]: ids } } as const)
      : ({
          [Op.or]: [
            { name: { [Op.in]: namesOrSerials } },
            { serial_number: { [Op.in]: namesOrSerials } },
          ],
        } as const);

  const rows = await db.models.Service.findAll({
    where,
    attributes: ['serial_number'],
    raw: true,
  });

  const typed = rows as unknown as ServiceSerialRow[];
  // unikalne seriale
  return Array.from(new Set(typed.map((r) => r.serial_number).filter(Boolean)));
}

// Parse bulk delete query parameters
export function parseRoutesBulkDeleteFilters(
  query: RoutesBulkDeleteQueryRaw
): RoutesBulkDeleteQueryFilters {
  return {
    serviceFrom: toStringArray(query.serviceFrom),
    serviceTo: toStringArray(query.serviceTo),
  };
}
