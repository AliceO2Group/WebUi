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
import { FormInputFile } from '../form/form-input';
import type React from 'react';

/**
 *
 */
export function CertsForm({ renew, fetcher }: { renew?: boolean; fetcher: ReturnType<typeof useFetcher> }) {

  return <div>
    <div className='flex-row justify-center'>
      <span className='f3 pv4'>{renew ? 'Renew certificate by' : 'Register service by'} providing file with .crt extension</span>
    </div>
    <fetcher.Form
      method='post'
      action='/certs'
      onInput={(event: React.ChangeEvent<HTMLFormElement>) => {
        fetcher.submit(event.currentTarget);
      }}

    >
      <FormInputFile name='certFile'/>
    </fetcher.Form>
  </div>;
}
