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

import { mockServices } from '~/feature/service/mocks/services.mock';
import type { Service } from '~/feature/service/types/service';
import type { ServiceRegistrationResult } from '~/feature/service/types/certificate';

export async function fetchServiceById(serviceId: string): Promise<Service> {
  const service = mockServices.find((item) => item.serviceId === serviceId);
  if (!service) {
    throw new Error('Service not found');
  }
  return service;
}

export async function confirmServiceCertificateRenewal(serviceId: string, certificateId: string): Promise<ServiceRegistrationResult> {
  await delay(500);
  return {
    certificateId,
    serviceId,
    status: 'registered',
  };
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
