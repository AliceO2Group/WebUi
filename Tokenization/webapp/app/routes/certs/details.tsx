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

import { Activity, useState } from 'react';

import type { Route } from './+types/table';

import { CertsForm } from '~/components/certs/certs-form';
import Modal from '~/components/window/modal';
import { WindowButtonAccept, WindowButtonCancel, WindowContent, WindowTitle } from '~/components/window/window-objects';
import { Form } from '~/components/form/form';
import { FormInput } from '~/components/form/form-input';
import { useFetcher, useLoaderData } from 'react-router';
import { CertsModal } from '~/components/certs/certs-modal';
import { useOpenCertModal } from '~/hooks/certs/cert-modal';

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
  const { id, service_name, issued_at, expires_at, ip_address } = cert;
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [serviceName, setServiceName] = useState<string>(service_name);

  const fetcher = useFetcher();
  const [certModalOpen, setCertModalOpen] = useOpenCertModal(fetcher);

  return (
    <div>
      <h2>Certificate Details for {service_name}</h2>
      <p>Service ID: {id}</p>
      <p>Issued At: {issued_at}</p>
      <p>Expires At: {expires_at}</p>
      <p>IP Address: {ip_address}</p>
      <button className='btn btn-primary' onClick={() => setIsInputVisible((prev) => !prev)}> Renew Certificate </button>
      <button className='mh2 btn btn-primary' onClick={() => setIsModalOpen(true)}> Rename service </button>
      <Activity mode={isInputVisible ? 'visible' : 'hidden'}>
        <CertsForm
          renew
          fetcher={fetcher}
        />
      </Activity>
      <Modal
        open={isModalOpen}
        setOpen={setIsModalOpen}
        className="bg-white"
      >
        <WindowTitle> Rename Service </WindowTitle>
        <WindowContent>
          <div className="flex-column g2">
            <Form>
              <FormInput
                labelText="Current Service Name:"
                value={serviceName}
                setValue={setServiceName}
              />
            </Form>
          </div>
        </WindowContent>
        <WindowButtonCancel/>
        <WindowButtonAccept className='btn-success'/>
      </Modal>
      <CertsModal
        open={certModalOpen as boolean}
        setOpen={setCertModalOpen as React.Dispatch<React.SetStateAction<boolean>>}
        fetcher={fetcher}
        renew
      />
    </div>
  );
}
