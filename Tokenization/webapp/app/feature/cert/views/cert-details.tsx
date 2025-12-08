import { Activity, useState } from 'react';
import { useFetcher } from 'react-router';

import type { Cert } from '../types/cert';
import { CertsForm } from '~/feature/cert/components/certs-form';
import Modal from '~/shared/components/window/modal';
import { WindowButtonAccept, 
  WindowButtonCancel, 
  WindowContent, 
  WindowTitle } from '~/shared/components/window/window-objects';
import { Form } from '~/shared/components/form/form';
import { FormInputString } from '~/shared/components/form/form-input';
import { CertsModal } from '~/feature/cert/components/certs-modal';
import { useOpenCertModal } from '~/feature/cert/hooks/cert-modal';
import useForm from '~/shared/components/form/hooks/useForm';

export default function CertDetailsView({ cert }: { cert: Cert }) {
  const { id, service_name, issued_at, expires_at, ip_address } = cert;
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [serviceName, setServiceName] = useState<string>(service_name);

  const fetcher = useFetcher();
  const {ref, fetcher: nameFetcher, submit} = useForm();
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
            <Form action={`/certs/${id}/rename`} fetcher={nameFetcher} submitRef={ref}>
              <FormInputString
                name="service_name"
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