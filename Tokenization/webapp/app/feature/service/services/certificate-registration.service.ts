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

/**
 * Simulates uploading a certificate file and returns a preview payload with pending status.
 */
export async function uploadServiceCertificate(file: File): Promise<ServiceCertificatePreview> {
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // to extract only the base64 part from the data URL
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const base64 = await fileToBase64(file);
  const response = await fetch('/api/certificate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 'certificateBase64': base64 }),
  });
  const data = await response.json();

  return data;
}

/**
 * Simulates confirming registration of a pending certificate.
 */
export async function confirmServiceCertificate(certificateId: string): Promise<ServiceRegistrationResult> {
  const response = await fetch(`/api/certificate/register`, { 
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({certificateId: certificateId}),
  });

  if (!response.ok) {
  	throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}
