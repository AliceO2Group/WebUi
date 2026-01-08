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

export type CertificateStatus =
  | 'pending'
  | 'registered'
  | 'revoked'
  | 'expired';

export type CreateCertificateRequestBody = {
  certificateBase64: string;
};

// Metadata information extracted from a certificate
export type CertificateMetadataDto = {
  certificateId: string;
  subject: string | null;
  commonName: string | null;
  serialNumber: string | null;
  issuer: string | null;
  validFrom: string;
  validTo: string;
  fingerprint: string | null;
  status: 'pending';
};

// Temporary cache entry for a certificate being processed
export type TemporaryCertificateCacheEntry = {
  id: string;
  status: 'pending';

  certificateBase64: string;

  metadata: CertificateMetadataDto;

  createdAt: Date;
};

// Parsed certificate details
export type ParsedCertificate = {
  subject: string | null;
  commonName: string | null;
  serialNumber: string | null;
  issuer: string | null;
  validFromIso: string;
  validToIso: string;
  fingerprint: string | null;
};

export type RegisterCertificateRequestBody = {
  certificateId: string;
};

export type RegisterCertificateResponse = {
  success: true;
};

export type RenewCertificateRequestBody = {
  certificateId: string;
  serviceId: number;
};

export type RenewCertificateResponse = {
  success: true;
  status: 'renewed';
  serviceId: number;
  certificate: CertificateMetadataDto;
};
