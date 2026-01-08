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

import { Op, Sequelize, col, literal } from 'sequelize';
import type { WhereOptions, OrderItem } from 'sequelize';

import type {
  TokenListQueryFilters,
  OrderingKey,
  TokenListItemDto,
  HttpMethod,
  TokenObject,
  TokenRow,
  TokenListQueryRaw,
} from '../../../types/query_types';

// Parse raw query parameters into typed filters
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

// Parse raw query into TokenListQueryFilters
export function parseTokenListFilters(
  query: TokenListQueryRaw
): TokenListQueryFilters {
  return {
    serviceFrom: toStringArray(query.serviceFrom),
    serviceTo: toStringArray(query.serviceTo),
    issuedAfter: toDate(query.issuedAfter),
    issuedBefore: toDate(query.issuedBefore),
    expiresAfter: toDate(query.expiresAfter),
    expiresBefore: toDate(query.expiresBefore),
    ordering: toStringArray(query.ordering),
  };
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

const dateToUnixSeconds = (d: Date) => Math.floor(d.getTime() / 1000);

// Build a JSON_UNQUOTE(JSON_EXTRACT(...)) expression as literal
const jsonString = (path: string) =>
  literal(`JSON_UNQUOTE(JSON_EXTRACT(token_object, '$.${path}'))`);

// Build a numeric JSON_EXTRACT expression as string for embedding in LEAST/GREATEST
const jsonNumExpr = (path: string) =>
  `CAST(JSON_EXTRACT(token_object, '$.${path}') AS UNSIGNED)`;

// issuedAt = MIN(iat.*) across methods, NULL if all missing
const issuedAtExpr = () =>
  literal(`
    NULLIF(
      LEAST(
        COALESCE(${jsonNumExpr('iat.GET')}, 9999999999),
        COALESCE(${jsonNumExpr('iat.POST')}, 9999999999),
        COALESCE(${jsonNumExpr('iat.PUT')}, 9999999999),
        COALESCE(${jsonNumExpr('iat.DELETE')}, 9999999999)
      ),
      9999999999
    )
  `);

// expiresAt = MAX(exp.*) across methods, NULL if all missing
const expiresAtExpr = () =>
  literal(`
    NULLIF(
      GREATEST(
        COALESCE(${jsonNumExpr('exp.GET')}, 0),
        COALESCE(${jsonNumExpr('exp.POST')}, 0),
        COALESCE(${jsonNumExpr('exp.PUT')}, 0),
        COALESCE(${jsonNumExpr('exp.DELETE')}, 0)
      ),
      0
    )
  `);


// Build WHERE clause based on provided filters
export function buildTokenWhere(filters: TokenListQueryFilters): WhereOptions {
  const where: WhereOptions = {};

  if (filters.serviceFrom?.length) {
    (where as any).subject = { [Op.in]: filters.serviceFrom };
  }
  if (filters.serviceTo?.length) {
    (where as any).audience = { [Op.in]: filters.serviceTo };
  }

  if (filters.issuedAfter || filters.issuedBefore) {
    const and: any[] = [];
    const issuedAt = issuedAtExpr();

    if (filters.issuedAfter) {
      and.push(
        Sequelize.where(issuedAt, {
          [Op.gte]: dateToUnixSeconds(filters.issuedAfter),
        })
      );
    }
    if (filters.issuedBefore) {
      and.push(
        Sequelize.where(issuedAt, {
          [Op.lte]: dateToUnixSeconds(filters.issuedBefore),
        })
      );
    }

    (where as any)[Op.and] = [...((where as any)[Op.and] ?? []), ...and];
  }

  // expires range: based on aggregated expiresAtExpr()
  if (filters.expiresAfter || filters.expiresBefore) {
    const and: any[] = [];
    const expiresAt = expiresAtExpr();

    if (filters.expiresAfter) {
      and.push(
        Sequelize.where(expiresAt, {
          [Op.gte]: dateToUnixSeconds(filters.expiresAfter),
        })
      );
    }
    if (filters.expiresBefore) {
      and.push(
        Sequelize.where(expiresAt, {
          [Op.lte]: dateToUnixSeconds(filters.expiresBefore),
        })
      );
    }

    (where as any)[Op.and] = [...((where as any)[Op.and] ?? []), ...and];
  }

  return where;
}

// Map ordering keys to actual DB expressions
const ORDERING_MAP: Record<OrderingKey, any> = {
  id: col('id'),
  serviceFrom: col('subject'),
  serviceTo: col('audience'),
  issuedAt: issuedAtExpr(),
  expiresAt: expiresAtExpr(),
  issuer: jsonString('iss'),
  created_at: col('created_at'),
  updated_at: col('updated_at'),
};

// Build ORDER clause based on provided ordering rules
export function buildTokenOrder(ordering?: string[]): OrderItem[] {
  const order: OrderItem[] = [];
  if (!ordering?.length) return order;

  for (const rule of ordering) {
    const [keyRaw, dirRaw] = String(rule).split(':');
    const key = (keyRaw?.trim() || '') as OrderingKey;
    const dir = (dirRaw?.trim()?.toLowerCase() === 'desc' ? 'DESC' : 'ASC') as
      | 'ASC'
      | 'DESC';

    if (!key || !(key in ORDERING_MAP)) continue;
    order.push([ORDERING_MAP[key], dir]);
  }

  return order;
}



// issuedAt = MIN(iat.*) across methods, NULL if all missing
const minFromTimings = (t: TokenObject['iat'] | undefined): number | null => {
  if (!t) return null;
  const vals = METHODS.map((m) => t[m]).filter(
    (v): v is number => typeof v === 'number'
  );
  return vals.length ? Math.min(...vals) : null;
};

// expiresAt = MAX(exp.*) across methods, NULL if all missing
const maxFromTimings = (t: TokenObject['exp'] | undefined): number | null => {
  if (!t) return null;
  const vals = METHODS.map((m) => t[m]).filter(
    (v): v is number => typeof v === 'number'
  );
  return vals.length ? Math.max(...vals) : null;
};

// allowedOperations = methods with defined iat or exp timings
const allowedOpsFromTimings = (
  iat: TokenObject['iat'],
  exp: TokenObject['exp']
): HttpMethod[] =>
  METHODS.filter(
    (m) => typeof iat?.[m] === 'number' || typeof exp?.[m] === 'number'
  );

  // Map DB row to TokenListItemDto
export function mapTokenRowToDto(row: TokenRow): TokenListItemDto {
  const obj = row.token_object;
  const jti = obj.jti ?? '';

  return {
    id: row.id,
    serviceFrom: row.subject,
    serviceTo: row.audience,
    issuedAt: minFromTimings(obj.iat),
    expiresAt: maxFromTimings(obj.exp),
    issuer: obj.iss,
    allowedOperations: allowedOpsFromTimings(obj.iat, obj.exp),
    tokenSuffix: jti.slice(-4),
  };
}
