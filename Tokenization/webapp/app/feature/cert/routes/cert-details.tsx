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
import type { Route } from './+types/cert-details';

import { useLoaderData } from 'react-router';
import CertDetailsView from '../views/cert-details';


export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
  const certId = parseInt((params as { certId: string }).certId, 10);

  const cert = {
    id: '1',
    service_name: 'Service One',
    issued_at: '2025-01-01',
    expires_at: '2027-01-01',
    ip_address: '192.168.1.1',
  };

  return { cert };
};

/**
 *
 */
export default function Details() {
  const { cert } = useLoaderData();
  return <CertDetailsView cert={cert} />;

}
