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
import { buildUrl, createQueryParams, parseJsonOrThrow } from '~/shared/http/http.utils';

/**
 * Uploads a service certificate file (as base64) and returns a preview of the certificate.
 */
export async function uploadServiceCertificate(file: File, token?: string | null): Promise<ServiceCertificatePreview> {
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // to extract only the base64 part from the data URL
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if(file.size === 0 || file.size > 20 * 1024) {
    throw Error('File size is not valid');
  }

  const base64 = await fileToBase64(file);
  const url = buildUrl('/api/certificate', createQueryParams(token));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ certificateBase64: base64 }),
  });
  return parseJsonOrThrow<ServiceCertificatePreview>(response, 'Uploading service certificate');
}

/**
 * Confirms the registration of a service certificate with the given certificate ID.
 */
export async function confirmServiceCertificate(certificateId: string, token?: string | null): Promise<ServiceRegistrationResult> {
  const url = buildUrl('/api/certificate/register', createQueryParams(token));

  const response = await fetch(url, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ certificateId }),
  });
  return parseJsonOrThrow<ServiceRegistrationResult>(response, 'Confirming service certificate');
}
