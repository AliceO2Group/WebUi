import { Activity, useState } from "react";

import type { Route } from "./+types/table";

import { CertsForm } from "~/components/certs/certs-form";
import Modal from "~/components/window/modal";
import { WindowButtonAccept, WindowButtonCancel, WindowContent, WindowTitle } from "~/components/window/window-objects";
import { Form } from "~/components/form/form";
import { useFetcher, useLoaderData } from "react-router";
import { CertsModal } from "~/components/certs/certs-modal";
import { useOpenCertModal } from "~/hooks/certs/cert-modal";

export const clientLoader = async ({ params }: Route.ClientLoaderArgs) => {
    const certId = parseInt((params as { certId: string }).certId, 10);

    const cert = {
        id: '1',
        service_name: 'Service One',
        issued_at: '2025-01-01',
        expires_at: '2027-01-01',
        ip_address: '192.168.1.1'
    }

    return { cert }
}

export default function Details() {
  const { cert } = useLoaderData();
  const {id, service_name, issued_at, expires_at, ip_address } = cert;
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetcher = useFetcher();
  const [certModalOpen, setCertModalOpen] = useOpenCertModal(fetcher)

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
                    <label className="db mb1" htmlFor="serviceName">New Service Name:</label>
                    <input className="input" id="serviceName" name="serviceName" type="text" defaultValue={service_name} />
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