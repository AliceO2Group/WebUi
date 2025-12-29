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

import type { Service } from '~/feature/service/types/service';
import type { ServiceRegistrationResult } from '~/feature/service/types/certificate';
import { buildUrl, createQueryParams, parseJsonOrThrow } from '~/shared/http/http.utils';

export async function fetchServiceById(serviceId: string, token?: string | null): Promise<Service> {
  const url = buildUrl(`/api/services/${serviceId}`, createQueryParams(token));
  const response = await fetch(url);
  return parseJsonOrThrow<Service>(response, 'Fetching service details');
}

export async function confirmServiceCertificateRenewal(
  serviceId: string,
  certificateId: string,
  token?: string | null,
): Promise<ServiceRegistrationResult> {
  const url = buildUrl('/api/certificate/renew', createQueryParams(token));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ serviceId, certificateId }),
  });
  return parseJsonOrThrow<ServiceRegistrationResult>(response, 'Confirming service certificate renewal');
}

