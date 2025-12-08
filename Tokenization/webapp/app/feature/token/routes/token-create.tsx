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
import type { Route } from './+types/token-create';

import type { clientLoader as CertTableLoader } from '~/feature/cert/routes/cert-table';

import { useFetcher } from 'react-router';
import CreateTokenView from '../views/token-create';
import { useEffect } from 'react';

// eslint-disable-next-line jsdoc/require-jsdoc
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  // eslint-disable-next-line no-console
  console.log(Object.fromEntries(formData.entries()));
  return { success: true };
}

/**
 * Component is used for /tokens/new route to create new tokens.
 */
export default function CreateToken() {
  const fetcher = useFetcher<typeof CertTableLoader>(); // Temporarily services can be fetched all
  useEffect(() => {
    fetcher.load('/certs/table');
  }, [fetcher]);
  const services = fetcher.data ?? [];
  const serviceOptions = services.map(service => ({
    label: service.service_name,
    value: service.id,
  }));
  return <CreateTokenView serviceOptions={serviceOptions} />;
}
