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

import { useMutation } from '@tanstack/react-query';

import { renewServiceCertificate } from '~/feature/service/services/service-details.service';
import { confirmServiceCertificate, uploadServiceCertificate } from '~/feature/service/services/certificate-registration.service';
import type { ServiceCertificatePreview, ServiceRegistrationResult } from '~/feature/service/types/certificate';

export function useServiceCertificateUploadMutation() {
  return useMutation<ServiceCertificatePreview, Error, File>({
    mutationFn: (file: File) => uploadServiceCertificate(file),
  });
}

export function useServiceCertificateConfirmMutation() {
  return useMutation<ServiceRegistrationResult, Error, string>({
    mutationFn: (certificateId: string) => confirmServiceCertificate(certificateId),
  });
}

export type ServiceCertificateRenewalPayload = {
  serviceId: string;
  file: File;
};

export function useServiceCertificateRenewalMutation() {
  return useMutation<ServiceCertificatePreview, Error, ServiceCertificateRenewalPayload>({
    mutationFn: ({ serviceId, file }: ServiceCertificateRenewalPayload) => renewServiceCertificate(serviceId, file),
  });
}
