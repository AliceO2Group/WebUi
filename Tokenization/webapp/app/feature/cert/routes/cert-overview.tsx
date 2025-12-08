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

import { useFetcher, useLoaderData } from 'react-router';

import { Box1_2 } from '~/ui/box';
import { CertsForm } from '~/feature/cert/components/certs-form';
import { CertsTable } from '~/feature/cert/components/certs-table';
import { useOpenCertModal } from '~/feature/cert/hooks/cert-modal';
import { CertsModal } from '~/feature/cert/components/certs-modal';

export const clientAction = async ({ request }: Route.ClientActionArgs) => {
  const formData = await request.formData();
  const certFile = formData.get('certFile');

  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async operation

  console.log('Received cert file:', certFile);
  const certContent = {
    ip_address: '192.168.1.1',
    issueDate: '2025-01-01',
    expiryDate: '2027-01-01',
  };
  return { certContent };
};

export const clientLoader = async () => [
  {
    id: '1',
    service_name: 'Service One',
    issued_at: '2025-01-01',
    expires_at: '2027-01-01',
    ip_address: '192.168.1.1',
  },
];

// eslint-disable-next-line jsdoc/require-jsdoc
export default function Overview() {
  const certs = useLoaderData();
  const fetcher = useFetcher();
  const [certModalOpen, setCertModalOpen] = useOpenCertModal(fetcher);

  return (
    <>
      <div className="grid-1-2">
        <Box1_2 link={'/certs/table'}>
          <div className="flex-row justify-center">
            <h4> Registered services</h4>
          </div>
          <CertsTable certs={certs} />
        </Box1_2>
        <Box1_2 link={null}>
          <CertsForm fetcher={fetcher} />
        </Box1_2>
      </div>
      <CertsModal
        open={certModalOpen as boolean}
        setOpen={setCertModalOpen as React.Dispatch<React.SetStateAction<boolean>>}
        fetcher={fetcher}
      />
    </>
  );
}
