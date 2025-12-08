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

import { useLoaderData } from 'react-router';
import CertsTableRouteView from '../views/cert-table';


/**
 *
 */
export function clientLoader() {
  return [
    {
      id: '1',
      service_name: 'Service One',
      issued_at: '2025-01-01',
      expires_at: '2027-01-01',
      ip_address: '192.168.1.1',
    }, {
      id: '2',
      service_name: 'Service Two',
      issued_at: '2024-06-15',
      expires_at: '2026-06-15',
      ip_address: '192.168.1.2',
    } , {
      id: '3',
      service_name: 'Service Three',
      issued_at: '2023-03-20',
      expires_at: '2025-03-20',
      ip_address: '192.168.1.3'
    }
  ];
}

/**
 *
 */
export default function CertsTableRoute() {
  const certs = useLoaderData();
  return <CertsTableRouteView certs={certs} />  

}
