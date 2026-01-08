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

import { Op, col } from 'sequelize';
import type { WhereOptions, OrderItem } from 'sequelize';

import type {
  ServicesListQueryRaw,
  ServiceListQueryFilters,
  ServiceOrderingKey,
  ServiceRow,
  ServiceListItemDto,
} from '../../../types/query_types';

// Helper functions to parse and build queries for services
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

// Parse date from unknown input
const toDate = (v: unknown): Date | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

// Parse raw query into ServiceListQueryFilters
const toSearchTerm = (v: unknown): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

// Parse raw query into ServiceListQueryFilters
export function parseServiceListFilters(
  query: ServicesListQueryRaw
): ServiceListQueryFilters {
  return {
    searchTerm: toSearchTerm(query.searchTerm),

    issuedAfter: toDate(query.issuedAfter),
    issuedBefore: toDate(query.issuedBefore),

    expiresAfter: toDate(query.expiresAfter),
    expiresBefore: toDate(query.expiresBefore),

    ordering: toStringArray(query.ordering),
  };
}

// Build Sequelize WHERE clause from ServiceListQueryFilters
export function buildServiceWhere(
  filters: ServiceListQueryFilters
): WhereOptions {
  const where: WhereOptions = {};

  if (filters.searchTerm) {
    (where as any).name = { [Op.like]: `%${filters.searchTerm}%` };
  }

  if (filters.issuedAfter || filters.issuedBefore) {
    (where as any).issued_at = {
      ...(filters.issuedAfter ? { [Op.gte]: filters.issuedAfter } : {}),
      ...(filters.issuedBefore ? { [Op.lte]: filters.issuedBefore } : {}),
    };
  }

  if (filters.expiresAfter || filters.expiresBefore) {
    (where as any).exp_at = {
      ...(filters.expiresAfter ? { [Op.gte]: filters.expiresAfter } : {}),
      ...(filters.expiresBefore ? { [Op.lte]: filters.expiresBefore } : {}),
    };
  }

  return where;
}

// Build Sequelize ORDER clause from ordering array
const ORDERING_MAP: Record<ServiceOrderingKey, any> = {
  id: col('id'),
  name: col('name'),
  serial_number: col('serial_number'),
  ip_address: col('ip_address'),
  issued_at: col('issued_at'),
  exp_at: col('exp_at'),
  created_at: col('created_at'),
  updated_at: col('updated_at'),
};

// Build ORDER clause based on provided ordering rules
export function buildServiceOrder(ordering?: string[]): OrderItem[] {
  const order: OrderItem[] = [];
  if (!ordering?.length) return order;

  for (const rule of ordering) {
    const [keyRaw, dirRaw] = String(rule).split(':');
    const key = (keyRaw?.trim() || '') as ServiceOrderingKey;
    const dir = (dirRaw?.trim()?.toLowerCase() === 'desc' ? 'DESC' : 'ASC') as
      | 'ASC'
      | 'DESC';

    if (!key || !(key in ORDERING_MAP)) continue;
    order.push([ORDERING_MAP[key], dir]);
  }

  return order;
}

// Map ServiceRow to ServiceListItemDto
export function mapServiceRowToDto(row: ServiceRow): ServiceListItemDto {
  return {
    id: row.id,
    name: row.name,
    issuedAt: row.issued_at ? row.issued_at.toISOString() : null,
    expiresAt: row.exp_at ? row.exp_at.toISOString() : null,
  };
}
