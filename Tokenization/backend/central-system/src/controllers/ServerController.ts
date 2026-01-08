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

import type { Request, Response } from 'express';
import { LogManager } from '@aliceo2/web-ui';
import { SequelizeDatabase } from '../lib/database/SequelizeDatabase.js';

import { TokensQueryService } from '../services/TokensQueryService.js';
import { ArchiveTokensQueryService } from '../services/ArchiveTokensQueryService.js';
import { ServicesQueryService } from '../services/ServicesQueryService.js';
import { SystemLogsQueryService } from '../services/SystemLogsQueryService.js';
import { RoutesQueryService } from '../services/RoutesQueryService.js';

import { parseTokenListFilters } from '../lib/database/utils/queryHelpersTokens.js';

import { parseServiceListFilters } from '../lib/database/utils/queryHelpersServices.js';

import {
  parseRoutesListFilters,
  normalizeIdOrName,
  isRoutePermissions,
  parseRoutesBulkDeleteFilters,
} from '../lib/database/utils/queryHelpersRoutes.js';

import { randomUUID } from 'node:crypto';

import type {
  CreateCertificateRequestBody,
  CertificateMetadataDto,
  TemporaryCertificateCacheEntry,
  RegisterCertificateRequestBody,
  RenewCertificateRequestBody,
  RegisterCertificateResponse,
  RenewCertificateResponse,
} from '../types/certificate_types';

import { CertificateService } from '../services/CertificateService.js';

/** Controller for handling server-related requests. */
export class ServerController {
  private _logger;
  private _temporaryCache: Map<string, TemporaryCertificateCacheEntry>;

  constructor(
    private readonly _db: SequelizeDatabase,
    private readonly _tokensService: TokensQueryService,
    private readonly _archiveTokensService: ArchiveTokensQueryService,
    private readonly _servicesService: ServicesQueryService,
    private readonly _systemLogsService: SystemLogsQueryService,
    private readonly _routesService: RoutesQueryService,
    private readonly _certificateService: CertificateService
  ) {
    this._logger = LogManager.getLogger('ServerController');
    this._temporaryCache = new Map<string, TemporaryCertificateCacheEntry>();
    this.getTokens = this.getTokens.bind(this);
    this.getTokenById = this.getTokenById.bind(this);
    this.deleteTokens = this.deleteTokens.bind(this);
    this.deleteTokenById = this.deleteTokenById.bind(this);
    this.getTokenLogs = this.getTokenLogs.bind(this);
    this.getServices = this.getServices.bind(this);
    this.getServiceById = this.getServiceById.bind(this);
    this.getRoutes = this.getRoutes.bind(this);
    this.createRoute = this.createRoute.bind(this);
    this.deleteRouteById = this.deleteRouteById.bind(this);
    this.deleteRoutes = this.deleteRoutes.bind(this);
    this.createCertificate = this.createCertificate.bind(this);
    this.registerCertificate = this.registerCertificate.bind(this);
    this.renewCertificate = this.renewCertificate.bind(this);
  }

  /** Get a list of tokens based on query parameters.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getTokens(req: Request, res: Response): Promise<void> {
    try {
      const filters = parseTokenListFilters(req.query);
      const status = String(req.query.status ?? '').toLowerCase();
      const isArchived = status === 'not-active';

      const data = isArchived
        ? await this._archiveTokensService.getTokens(this._db, filters)
        : await this._tokensService.getTokens(this._db, filters);

      res.status(200).json(data);
    } catch (err: any) {
      this._logger.error('getTokens failed', {
        err: err?.message ?? String(err),
        stack: err?.stack,
      });

      res.status(500).json({
        error: 'TOKENS_QUERY_FAILED',
        message: 'Failed to fetch tokens.',
      });
    }
  }

  /** Get a single token by its ID.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getTokenById(req: Request, res: Response): Promise<void> {
    try {
      const rawId = String(req.params.tokenId ?? '').trim();
      const id = Number(rawId);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: `Invalid token id: ${rawId}` });
        return;
      }

      const statusRaw = String(req.query.status ?? 'active').toLowerCase();
      const isArchived = statusRaw === 'not-active';

      const token = isArchived
        ? await this._archiveTokensService.getTokenById(this._db, id)
        : await this._tokensService.getTokenById(this._db, id);

      if (!token) {
        res.status(404).json({ error: `No token found with id ${id}` });
        return;
      }

      res.status(200).json(token);
    } catch (err: any) {
      this._logger.error('getTokenById failed', {
        err: err?.message ?? String(err),
        stack: err?.stack,
      });

      res.status(500).json({
        error: 'TOKEN_QUERY_FAILED',
        message: 'Failed to fetch token.',
      });
    }
  }

  /** Disable tokens based on query parameters.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async deleteTokens(req: Request, res: Response): Promise<void> {
    try {
      const filters = parseTokenListFilters(req.query);

      const affected = await this._tokensService.disableTokens(
        this._db,
        filters
      );

      res.status(200).json({ success: true });

      this._logger.info('Bulk token disable completed', { affected });
    } catch (err: any) {
      this._logger.error('deleteTokens failed', {
        err: err?.message ?? String(err),
        stack: err?.stack,
      });

      res.status(500).json({
        error: 'TOKENS_DISABLE_FAILED',
        message: 'Failed to disable tokens.',
      });
    }
  }

  /** Disable a single token by its ID.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async deleteTokenById(req: Request, res: Response): Promise<void> {
    try {
      const rawId = String(req.params.tokenId ?? '').trim();
      const id = Number(rawId);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: `Invalid token id: ${rawId}` });
        return;
      }

      const ok = await this._tokensService.disableTokenById(this._db, id);

      if (!ok) {
        res.status(404).json({ error: 'Token not found' });
        return;
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      this._logger.error('deleteTokenById failed', {
        err: err?.message ?? String(err),
        stack: err?.stack,
      });

      res.status(500).json({
        error: 'TOKEN_DISABLE_FAILED',
        message: 'Failed to disable token.',
      });
    }
  }

  /** Get logs associated with a specific token ID.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getTokenLogs(req: Request, res: Response): Promise<void> {
    try {
      const tokenId = String(req.params.tokenId ?? '').trim();

      if (!tokenId) {
        res.status(400).json({ error: 'Missing tokenId' });
        return;
      }

      const logs = await this._systemLogsService.getTokenLogs(
        this._db,
        tokenId
      );

      if (!logs.length) {
        res.status(404).json({ error: `No logs found for token ${tokenId}` });
        return;
      }

      res.status(200).json(logs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('getTokenLogs failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'TOKEN_LOGS_QUERY_FAILED',
        message: 'Failed to fetch token logs.',
      });
    }
  }

  /** Get a list of services based on query parameters.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getServices(req: Request, res: Response): Promise<void> {
    try {
      const filters = parseServiceListFilters(req.query);

      const data = await this._servicesService.getServices(this._db, filters);
      res.status(200).json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('getServices failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'SERVICES_QUERY_FAILED',
        message: 'Failed to fetch services.',
      });
    }
  }

  /** Get a single service by its ID.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getServiceById(req: Request, res: Response): Promise<void> {
    try {
      const serviceIdRaw = String(req.params.serviceId ?? '').trim();
      const serviceId = Number(serviceIdRaw);

      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        res.status(400).json({ error: `Invalid service id ${serviceIdRaw}` });
        return;
      }

      const service = await this._servicesService.getServiceById(
        this._db,
        serviceId
      );

      if (!service) {
        res
          .status(404)
          .json({ error: `No service found with id ${serviceIdRaw}` });
        return;
      }

      res.status(200).json(service);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('getServiceById failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'SERVICE_QUERY_FAILED',
        message: 'Failed to fetch service.',
      });
    }
  }

  /** Get a list of routes based on query parameters.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async getRoutes(req: Request, res: Response): Promise<void> {
    try {
      const filters = parseRoutesListFilters(req.query);

      const data = await this._routesService.getRoutes(this._db, filters);
      res.status(200).json(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('getRoutes failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'ROUTES_QUERY_FAILED',
        message: 'Failed to fetch routes.',
      });
    }
  }

  /** Create a new route between two services.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async createRoute(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body;

      const from = normalizeIdOrName(body?.serviceFromId);
      const to = normalizeIdOrName(body?.serviceToId);
      const permissions = body?.permissions;

      if (!from || !to || !permissions) {
        res.status(400).json({
          error: 'serviceFromId, serviceToId and permissions are required',
        });
        return;
      }

      if (!isRoutePermissions(permissions)) {
        res.status(400).json({ error: 'Invalid permissions format' });
        return;
      }

      const created = await this._routesService.createRoute(
        this._db,
        from,
        to,
        permissions
      );

      res.status(201).json(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const code = err instanceof Error ? (err as any).code : undefined;

      if (code === 'INVALID_SERVICES') {
        res.status(400).json({ error: 'Invalid serviceFrom or serviceTo' });
        return;
      }

      if (code === 'ROUTE_EXISTS') {
        res.status(409).json({ error: 'Route already exists' });
        return;
      }

      this._logger.error('createRoute failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'ROUTE_CREATE_FAILED',
        message: 'Failed to create route.',
      });
    }
  }

  /** Delete a route by its ID.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async deleteRouteById(req: Request, res: Response): Promise<void> {
    try {
      const rawId = String(req.params.routeId ?? '').trim();
      const routeId = Number(rawId);

      if (!Number.isInteger(routeId) || routeId <= 0) {
        res.status(400).json({ error: `Invalid route id: ${rawId}` });
        return;
      }

      await this._routesService.deleteRouteById(this._db, routeId);

      res.status(200).json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('deleteRouteById failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'ROUTE_DELETE_FAILED',
        message: 'Failed to delete route.',
      });
    }
  }

  /** Delete routes based on bulk delete filters.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async deleteRoutes(req: Request, res: Response): Promise<void> {
    try {
      const filters = parseRoutesBulkDeleteFilters(req.query);

      await this._routesService.deleteRoutes(this._db, filters);

      res.status(200).json({ success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('deleteRoutes failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({
        error: 'ROUTES_BULK_DELETE_FAILED',
        message: 'Failed to delete routes.',
      });
    }
  }

  /** Create a new certificate from a base64-encoded string.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async createCertificate(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as CreateCertificateRequestBody;
      const certificateBase64 = (body?.certificateBase64 ?? '').trim();

      if (!certificateBase64) {
        res.status(400).json({ error: 'certificateBase64 is required' });
        return;
      }

      const parsed =
        this._certificateService.parseCertificateBase64(certificateBase64);

      const certificateId = randomUUID();

      const dto: CertificateMetadataDto = {
        certificateId,
        subject: parsed.subject,
        commonName: parsed.commonName,
        serialNumber: parsed.serialNumber,
        issuer: parsed.issuer,
        validFrom: parsed.validFromIso,
        validTo: parsed.validToIso,
        fingerprint: parsed.fingerprint,
        status: 'pending',
      };

      const entry: TemporaryCertificateCacheEntry = {
        id: certificateId,
        status: 'pending',
        certificateBase64,
        metadata: dto,
        createdAt: new Date(),
      };

      this._temporaryCache.set(certificateId, entry);

      res.status(200).json(dto);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('createCertificate failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(400).json({
        error: 'CERTIFICATE_PARSE_FAILED',
        message: 'Failed to parse certificate.',
      });
    }
  }

  /** Register a pending certificate by its ID.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async registerCertificate(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as RegisterCertificateRequestBody;
      const certificateId = String(body?.certificateId ?? '').trim();

      if (!certificateId) {
        res.status(400).json({ error: 'certificateId is required' });
        return;
      }

      const entry = this._temporaryCache.get(certificateId);
      if (!entry) {
        res.status(404).json({
          error: `No pending certificate found with id ${certificateId}`,
        });
        return;
      }

      await this._certificateService.registerPendingCertificate(
        this._db,
        entry
      );

      this._temporaryCache.delete(certificateId);

      const response: RegisterCertificateResponse = { success: true };
      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('registerCertificate failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({ error: 'CERTIFICATE_REGISTER_FAILED' });
    }
  }

  /** Renew a certificate for a service.
   * @param req - Express request object.
   * @param res - Express response object.
   */
  public async renewCertificate(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as RenewCertificateRequestBody;

      const certificateId = String(body?.certificateId ?? '').trim();
      const serviceId = Number(body?.serviceId);

      if (!certificateId) {
        res.status(400).json({ error: 'certificateId is required' });
        return;
      }
      if (!Number.isInteger(serviceId) || serviceId <= 0) {
        res.status(400).json({ error: 'serviceId is required' });
        return;
      }

      const entry = this._temporaryCache.get(certificateId);
      if (!entry) {
        res
          .status(404)
          .json({
            error: `No pending certificate found with id ${certificateId}`,
          });
        return;
      }

      await this._certificateService.renewCertificateForService(
        this._db,
        serviceId,
        entry
      );

      this._temporaryCache.delete(certificateId);

      const response: RenewCertificateResponse = {
        success: true,
        status: 'renewed',
        serviceId,
        certificate: entry.metadata,
      };

      res.status(200).json(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._logger.error('renewCertificate failed', {
        err: message,
        stack: err instanceof Error ? err.stack : undefined,
      });

      res.status(500).json({ error: 'CERTIFICATE_RENEW_FAILED' });
    }
  }
}
