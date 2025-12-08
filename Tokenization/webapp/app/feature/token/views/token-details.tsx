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

import { Await, Link } from 'react-router';
import { Suspense } from 'react';

import type { Log } from '../types/log';
import type { Token } from '../types/token';

import { TokenLogs } from '~/feature/token/components/token-logs';
import { Spinner } from '~/ui/spinner';

/**
 *
 */
export default function TokenDetailsView({ token, logs }: { token: Token; logs: Promise<Log[]> }) {
  const { id, last4chars, issuer, iat, serviceFrom, serviceTo, exp } = token;
  const expirationDate = exp.split('T').reverse().join(' - ');

  const fields = [
    { label: 'Last 4 token characters', value: last4chars },
    { label: 'Issuer', value: issuer },
    { label: 'Issued at', value: iat },
    { label: 'Subject', value: serviceFrom },
    { label: 'Audience', value: serviceTo },
    { label: 'Expires at', value: expirationDate },
  ];

  return <>
    <h1>Token {id} details</h1>
    {fields.map((f) => (
      <p key={f.label}>
        {f.label}: <strong>{f.value ?? '—'}</strong>
      </p>
    ))}
    <h2>Logs</h2>
    <Suspense fallback={<Spinner size={2} align={'left'} />}>
      <Await resolve={logs} errorElement={<div><em>Failed to load the logs</em></div>}>
        {(logs) => <TokenLogs logs={logs} />}
      </Await>
    </Suspense>
    <Link to={'/tokens'}>Back to overview</Link>
  </>;
}
