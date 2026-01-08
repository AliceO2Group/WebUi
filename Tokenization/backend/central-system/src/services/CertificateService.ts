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

import { X509Certificate } from 'node:crypto';
import type { ParsedCertificate } from '../types/certificate_types';
import { SequelizeDatabase } from '../lib/database/SequelizeDatabase.js';
import type { TemporaryCertificateCacheEntry } from '../types/certificate_types';

import { emitAndWait } from '../lib/event-bus/rpc.js';
import { EventType } from '../lib/utils/events.js';

import type { ServiceRow } from '../types/query_types';
// Service for handling certificate-related operations.
export class CertificateService {
  /** Parse a Base64-encoded X.509 certificate.
   * @param certificateBase64 - The Base64-encoded certificate string.
   * @returns ParsedCertificate object containing certificate details.
   * @throws Will throw an error if the certificate is invalid or cannot be parsed.
   */
  public parseCertificateBase64(certificateBase64: string): ParsedCertificate {
    const bytes = this._decodeBase64(certificateBase64);
    const cert = this._readX509(bytes);

    const subject = this._safeString(cert.subject);
    const issuer = this._safeString(cert.issuer);

    const commonName =
      this._safeString(this._tryGetSubjectAltName(cert)) ??
      this._extractCommonName(subject);

    const serialNumber = this._safeString(this._tryGetSerialNumber(cert));

    return {
      subject,
      commonName,
      serialNumber,
      issuer,
      validFromIso: this._toIsoDateString(cert.validFrom),
      validToIso: this._toIsoDateString(cert.validTo),
      fingerprint: this._safeString(cert.fingerprint),
    };
  }

  /** Decode a Base64-encoded string to a Buffer.
   * @param b64 - The Base64-encoded string.
   * @returns Buffer containing the decoded bytes.
   * @throws Will throw an error if the input is not valid Base64.
   */
  private _decodeBase64(b64: string): Buffer {
    const normalized = String(b64 ?? '').trim();
    if (!normalized) throw new Error('certificateBase64 is required');

    const bytes = Buffer.from(normalized, 'base64');
    if (!bytes.length) throw new Error('Invalid Base64 certificate content');

    return bytes;
  }

  /** Read and parse an X.509 certificate from a Buffer.
   * @param bytes - Buffer containing the certificate bytes.
   * @returns X509Certificate object.
   * @throws Will throw an error if the certificate cannot be parsed.
   */
  private _readX509(bytes: Buffer): X509Certificate {
    try {
      return new X509Certificate(bytes);
    } catch {
      throw new Error('Invalid X.509 certificate');
    }
  }

  /** Safely convert a value to a trimmed string or null.
   * @param v - The value to convert.
   * @returns Trimmed string or null if the value is not a valid string.
   */
  private _safeString(v: unknown): string | null {
    const s = typeof v === 'string' ? v.trim() : '';
    return s.length ? s : null;
  }

  /** Convert a date string or Date object to an ISO string.
   * @param d - The date string or Date object.
   * @returns ISO string representation of the date.
   * @throws Will throw an error if the date is invalid.
   */
  private _toIsoDateString(d: string | Date): string {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid certificate validity timestamp');
    }
    return date.toISOString();
  }

  /** Extract the Common Name (CN) from a certificate subject string.
   * @param subject - The subject string from the certificate.
   * @returns The Common Name or null if not found.
   */
  private _extractCommonName(subject: string | null): string | null {
    if (!subject) return null;
    const m = subject.match(/(?:^|,\s*)CN=([^,]+)/);
    return m ? m[1].trim() : null;
  }

  /** Try to get the Subject Alternative Name (SAN) from the certificate.
   * @param cert - The X509Certificate object.
   * @returns The SAN string or undefined if not present.
   */
  private _tryGetSubjectAltName(cert: X509Certificate): string | undefined {
    return (cert as unknown as { subjectAltName?: string }).subjectAltName;
  }

  /** Try to get the serial number from the certificate.
   * @param cert - The X509Certificate object.
   * @returns The serial number string or undefined if not present.
   */
  private _tryGetSerialNumber(cert: X509Certificate): string | undefined {
    return (cert as unknown as { serialNumber?: string }).serialNumber;
  }

  /** Write the certificate and its metadata to the credential vault.
   * @param entry - The TemporaryCertificateCacheEntry containing certificate data.
   * @returns Promise that resolves when the operation is complete.
   * @throws Will throw an error if the vault operation fails.
   */
  private async writeCertificateToVault(
    entry: TemporaryCertificateCacheEntry
  ): Promise<void> {
    const serial = entry.metadata.serialNumber;
    if (!serial) {
      const err = new Error('Certificate has no serialNumber');
      (err as { code?: string }).code = 'CERT_NO_SERIAL';
      throw err;
    }

    const path = `certificates/${serial}`;
    const body = {
      data: {
        certificateBase64: entry.certificateBase64,
        metadataJson: JSON.stringify(entry.metadata),
      },
    };

    await emitAndWait(EventType.CREATE_OR_UPDATE_CREDENTIAL_VAULT, {
      path,
      body,
    });
  }

  /** Register a pending certificate in the database and vault.
   * @param db - SequelizeDatabase instance.
   * @param entry - TemporaryCertificateCacheEntry containing certificate data.
   * @returns Promise resolving to void.
   * @throws Will throw an error if the database or vault operation fails.
   */
  public async registerPendingCertificate(
    db: SequelizeDatabase,
    entry: TemporaryCertificateCacheEntry
  ): Promise<void> {
    const serial = entry.metadata.serialNumber;
    const name =
      entry.metadata.commonName ?? entry.metadata.subject ?? 'unknown-service';
    const validFrom = new Date(entry.metadata.validFrom);
    const validTo = new Date(entry.metadata.validTo);

    if (!serial) {
      const err = new Error('Certificate has no serialNumber');
      (err as { code?: string }).code = 'CERT_NO_SERIAL';
      throw err;
    }
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validTo.getTime())) {
      const err = new Error('Invalid certificate validity dates');
      (err as { code?: string }).code = 'CERT_INVALID_DATES';
      throw err;
    }

    try {
      await db.sequelize.transaction(async (t: unknown) => {
        const existing = await db.models.Service.findOne({
          where: { serial_number: serial },
          transaction: t as never,
          raw: true,
        });

        if (existing) {
          await db.models.Service.update(
            { name, issued_at: validFrom, exp_at: validTo },
            { where: { serial_number: serial }, transaction: t as never }
          );
        } else {
          await db.models.Service.create(
            {
              name,
              serial_number: serial,
              ip_address: '0.0.0.0', // placeholder
              issued_at: validFrom,
              exp_at: validTo,
            },
            { transaction: t as never }
          );
        }
      });

      await this.writeCertificateToVault(entry);
    } catch (err) {
      console.error(
        '[CertificateLifecycleService.registerPendingCertificate] failed:',
        err
      );
      throw err;
    }
  }

  /** Renew a certificate for a service.
   * @param db - SequelizeDatabase instance.
   * @param serviceId - ID of the service to renew the certificate for.
   * @param entry - TemporaryCertificateCacheEntry containing new certificate data.
   * @returns Promise resolving to the updated ServiceRow.
   * @throws Will throw an error if the database or vault operation fails.
   */
  public async renewCertificateForService(
    db: SequelizeDatabase,
    serviceId: number,
    entry: TemporaryCertificateCacheEntry
  ): Promise<ServiceRow> {
    const serial = entry.metadata.serialNumber;
    const name =
      entry.metadata.commonName ?? entry.metadata.subject ?? 'unknown-service';
    const validFrom = new Date(entry.metadata.validFrom);
    const validTo = new Date(entry.metadata.validTo);

    if (!serial) {
      const err = new Error('Certificate has no serialNumber');
      (err as { code?: string }).code = 'CERT_NO_SERIAL';
      throw err;
    }
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validTo.getTime())) {
      const err = new Error('Invalid certificate validity dates');
      (err as { code?: string }).code = 'CERT_INVALID_DATES';
      throw err;
    }

    try {
      let updatedService: ServiceRow | null = null;

      await db.sequelize.transaction(async (t: unknown) => {
        const row = await db.models.Service.findByPk(serviceId, {
          transaction: t as never,
          raw: true,
        });

        const service = row as unknown as ServiceRow | null;
        if (!service) {
          const err = new Error(`No service found with id ${serviceId}`);
          (err as { code?: string }).code = 'SERVICE_NOT_FOUND';
          throw err;
        }
        if (service.serial_number !== serial) {
          const err = new Error(
            'Certificate serial does not match service serial_number'
          );
          (err as { code?: string }).code = 'SERIAL_MISMATCH';
          throw err;
        }

        await db.models.Service.update(
          { name, issued_at: validFrom, exp_at: validTo },
          { where: { id: serviceId }, transaction: t as never }
        );

        const refreshed = await db.models.Service.findByPk(serviceId, {
          transaction: t as never,
          raw: true,
        });

        updatedService = refreshed as unknown as ServiceRow | null;
      });

      await this.writeCertificateToVault(entry);

      return updatedService as unknown as ServiceRow;
    } catch (err) {
      console.error(
        '[CertificateLifecycleService.renewCertificateForService] failed:',
        err
      );
      throw err;
    }
  }
}
