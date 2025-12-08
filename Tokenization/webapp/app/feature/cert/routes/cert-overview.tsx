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
import type { Route } from './+types/cert-overview';

import { useLoaderData } from 'react-router';
import CertsOverviewView from '../views/cert-overview';

import { newServiceMock } from '../mocks/services';
export const clientAction = async ({ request }: Route.ClientActionArgs) => {
  const formData = await request.formData();
  const certFile = formData.get('certFile');

  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation

  console.log('Received cert file:', certFile);
  return { certContent: newServiceMock };
};

import { servicesMock } from '../mocks/services';
export const clientLoader = async () => servicesMock;

// eslint-disable-next-line jsdoc/require-jsdoc
export default function CertsOverview() {
  const certs = useLoaderData();
  return <CertsOverviewView certs={certs} />
}
