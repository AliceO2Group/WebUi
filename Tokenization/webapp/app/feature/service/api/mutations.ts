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

import { confirmServiceCertificateRenewal } from '~/feature/service/services/service-details.service';
import { confirmServiceCertificate, uploadServiceCertificate } from '~/feature/service/services/certificate-registration.service';
import type { ServiceCertificatePreview, ServiceRegistrationResult } from '~/feature/service/types/certificate';
import { useSession } from '~/feature/auth/hooks/session';

/**
 *
 */
export function useServiceCertificateUploadMutation() {
  const { token } = useSession();

  return useMutation<ServiceCertificatePreview, Error, File>({
    mutationFn: (file: File) => uploadServiceCertificate(file, token),
  });
}

/**
 *
 */
export function useServiceCertificateConfirmMutation() {
  const { token } = useSession();

  return useMutation<ServiceRegistrationResult, Error, string>({
    mutationFn: (certificateId: string) => confirmServiceCertificate(certificateId, token),
  });
}

export type ServiceCertificateRenewConfirmPayload = {
  serviceId: string;
  certificateId: string;
};

/**
 *
 */
export function useServiceCertificateRenewConfirmMutation() {
  const { token } = useSession();

  return useMutation<ServiceRegistrationResult, Error, ServiceCertificateRenewConfirmPayload>({
    mutationFn: ({ serviceId, certificateId }: ServiceCertificateRenewConfirmPayload) =>
      confirmServiceCertificateRenewal(serviceId, certificateId, token),
  });
}
