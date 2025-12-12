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

import type { ServiceCertificatePreview, ServiceRegistrationResult } from '~/feature/service/types/certificate';

const mockIssuer = 'ALICE Service Authority';
const mockSubject = 'CERN/ALICE';

/**
 * Simulates uploading a certificate file and returns a preview payload with pending status.
 */
export async function uploadServiceCertificate(file: File): Promise<ServiceCertificatePreview> {
  await delay(1200);
  const certificateId = '1';
  return {
    certificateId,
    subject: mockSubject,
    commonName: file.name.replace(/\.(cert|crt|pem)$/i, ''),
    issuer: mockIssuer,
    validFrom: '2025-01-01T08:00:00Z',
    validTo: '2027-01-01T08:00:00Z',
    fingerprint: 'AA:BB:CC:DD:EE:FF:11:22:33:44',
    status: 'pending',
  };
}

/**
 * Simulates confirming registration of a pending certificate.
 */
export async function confirmServiceCertificate(certificateId: string): Promise<ServiceRegistrationResult> {
  await delay(1000);
  return {
    certificateId,
    serviceId: certificateId.replace('cert', 'svc'),
    status: 'registered',
  };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
