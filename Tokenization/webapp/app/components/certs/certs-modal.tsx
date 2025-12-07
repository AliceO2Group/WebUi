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

import type { useFetcher } from 'react-router';

import type { DialogPropsBase } from '~/utils/types';

import { Spinner } from '~/ui/spinner';
import { WindowButtonAccept, WindowCloseIcon, WindowContent, WindowTitle } from '~/components/window/window-objects';
import Modal from '~/components/window/modal';

export const CertsModal = ({ open, setOpen, fetcher, renew }: DialogPropsBase & { fetcher: ReturnType<typeof useFetcher>; renew?: boolean }) => (
  <Modal
    open={open}
    setOpen={setOpen}
    className="bg-white"
  >
    <WindowTitle> {renew ? 'Renewal' : 'Certificate Registration'} </WindowTitle>
    <WindowContent>
      { fetcher.state === 'loading' || fetcher.state === 'submitting'
        ? <Spinner />
        : <div className="flex-column g2">
          <pre>
            {fetcher.data && typeof fetcher.data === 'object' && 'certContent' in fetcher.data ?
              Object.entries((fetcher.data as { certContent: Record<string, string> }).certContent).map(([key, value]) => (
                <div key={key}>{key}: {value}</div>
              ))
              : 'Error parsing certificate.'}
          </pre>
        </div>
      }
    </WindowContent>
    <WindowButtonAccept/>
    <WindowCloseIcon />
  </Modal>
);
