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
import { useEffect, useState } from 'react';
import { useFetcher } from 'react-router';

import type { DialogPropsBase } from '~/utils/types';

import { Spinner } from '~/ui/spinner';
import { WindowButtonAccept, WindowCloseIcon, WindowContent, WindowTitle } from '~/components/window/window-objects';
import Modal from '~/components/window/modal';

function ParsedCertData({fetcher}: {fetcher: ReturnType<typeof useFetcher>}) {
  return <>
          {fetcher.data && typeof fetcher.data === 'object' && 'certContent' in fetcher.data ?
            Object.entries((fetcher.data as { certContent: Record<string, string> }).certContent).map(([key, value]) => (
              <div key={key}>{key}: {value}</div>
            ))
            : 'Error parsing certificate.'}
         </>;
}


function CertsModalRegisterContent({fetcher}: {fetcher: ReturnType<typeof useFetcher>}) {
  const _fetcher = useFetcher();
  
  return <div className="flex-column g2">
            <_fetcher.Form>
              <div className='flex-row' >
              <label htmlFor="serviceName" className='mh2 mv1 self-center'>
                Provide service name:
              </label>
              <input 
                id="serviceName"
                type="text" 
                name="serviceName"
                className='mh1 self-center' 
                />
              </div>
              <button type="submit" hidden> Register Certificate </button>
            </_fetcher.Form>
          <pre>
            <ParsedCertData fetcher={fetcher} />
          </pre>
        </div>
}

function CertsModalRenewContent({fetcher}: {fetcher: ReturnType<typeof useFetcher>}) {
  return <div className="flex-column g2">
          <pre>
            <ParsedCertData fetcher={fetcher} />
          </pre>
        </div>
        
}

export const CertsModal = ({ open, setOpen, fetcher, renew }: DialogPropsBase & { fetcher: ReturnType<typeof useFetcher>; renew?: boolean }) => {
  return <Modal
    open={open}
    setOpen={setOpen}
    className="bg-white"
  >
    <WindowTitle> {renew ? 'Renewal' : 'Certificate Registration'} </WindowTitle>
    <WindowContent>
      { fetcher.state === 'loading' || fetcher.state === 'submitting'
        ? <Spinner />
        : (renew
            ? <CertsModalRenewContent fetcher={fetcher} />
            : <CertsModalRegisterContent fetcher={fetcher} />
          )
      }
    </WindowContent>
    <WindowButtonAccept/>
    <WindowCloseIcon />
  </Modal>
};
