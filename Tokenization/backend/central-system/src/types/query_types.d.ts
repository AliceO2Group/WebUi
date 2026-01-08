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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TokenTimings = Partial<Record<HttpMethod, number>>;

export type TokenObject = {
  sub: string;
  aud: string;
  iss: string;
  iat: TokenTimings;
  exp: TokenTimings;
  jti: string;
};

export type OrderingKey =
  | 'id'
  | 'serviceFrom'
  | 'serviceTo'
  | 'issuedAt'
  | 'expiresAt'
  | 'issuer'
  | 'created_at'
  | 'updated_at';

export type TokenListQueryFilters = {
  serviceFrom?: string[];
  serviceTo?: string[];
  issuedAfter?: Date;
  issuedBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
  ordering?: string[];
};

export type TokenListItemDto = {
  id: number;
  serviceFrom: string;
  serviceTo: string;
  issuedAt: number | null;
  expiresAt: number | null;
  issuer: string;
  allowedOperations: HttpMethod[];
  tokenSuffix: string;
};

export type TokenRow = {
  id: number;
  subject: string;
  audience: string;
  token_object: TokenObject;
  created_at?: Date;
  updated_at?: Date;
};

export type TokenListQueryRaw = {
  serviceFrom?: string | string[];
  serviceTo?: string | string[];
  issuedAfter?: string;
  issuedBefore?: string;
  expiresAfter?: string;
  expiresBefore?: string;
  ordering?: string | string[];
};

export interface DatabaseModel {
  Token: any;
  ArchiveToken: any;
  SystemLog: any;
  Route: any;
  Service: any;
}

export type TokenLogListItemDto = {
  id: number;
  event: string;
  timestamp: string;
};

export type TokenLogsQueryFilters = {
  limit?: number;
};

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type SystemLogRow = {
  id: number;
  timestamp: Date;
  event: string;
};

export type ServiceOrderingKey =
  | 'id'
  | 'name'
  | 'serial_number'
  | 'ip_address'
  | 'issued_at'
  | 'exp_at'
  | 'created_at'
  | 'updated_at';

export type ServiceListQueryFilters = {
  searchTerm?: string;
  issuedAfter?: Date;
  issuedBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
  ordering?: string[];
};

export type ServiceListItemDto = {
  id: number;
  name: string;
  issuedAt: string | null;
  expiresAt: string | null;
};

export type ServiceRow = {
  id: number;
  name: string;
  serial_number: string;
  ip_address: string;
  issued_at: Date | null;
  exp_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type ServicesListQueryRaw = {
  searchTerm?: string;
  issuedBefore?: string;
  issuedAfter?: string;
  expiresBefore?: string;
  expiresAfter?: string;
  ordering?: string | string[];
};

export type RoutePermissions = Partial<Record<HttpMethod, number>>;

export type RouteStatus = 'active' | 'disabled';

export type RoutesListQueryFilters = {
  serviceFrom?: string[];
  serviceTo?: string[];
};

export type RouteRow = {
  id: number;
  sender_serial_number: string;
  receiver_serial_number: string;
  permissions: RoutePermissions;
  status: RouteStatus;
  created_at: Date;
  updated_at: Date;
};

export type RouteListItemDto = {
  id: number;
  serviceFrom: string;
  serviceTo: string;
  permissions: RoutePermissions;
};

export type CreateRouteRequestBody = {
  serviceFromId: string;
  serviceToId: string;
  permissions: RoutePermissions;
};

export type CreateRouteDto = {
  id: number;
  serviceFrom: string;
  serviceTo: string;
  permissions: RoutePermissions;
};

export type ServiceRow = {
  id: number;
  name: string;
  serial_number: string;
  ip_address?: string;
  issued_at?: Date | null;
  exp_at?: Date | null;
};

export type RouteRow = {
  id: number;
  sender_serial_number: string;
  receiver_serial_number: string;
  permissions: RoutePermissions;
};

export type RoutesBulkDeleteQueryFilters = {
  serviceFrom?: string[];
  serviceTo?: string[];
};

export type RoutesBulkDeleteQueryRaw = {
  serviceFrom?: string | string[];
  serviceTo?: string | string[];
};

export type ServiceSerialRow = { serial_number: string };
