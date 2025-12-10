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

import { Link } from 'react-router';
import { useState } from 'react';

import type { Log } from '~/feature/token/types/log';
import type { Token } from '~/feature/token/types/token';

import { TokenLogs } from '~/feature/token/components/token-logs';
import { Spinner } from '~/ui/spinner';
import TokenDetailsWindows from './TokenDetailsWindows';


/**
 * Displays summary information about a token and renders ban/unban controls plus logs.
 */
export default function TokenDetails({
  token,
  logs,
  logsPending,
  logsError,
}: {
  token: Token;
  logs: Log[];
  logsPending: boolean;
  logsError?: string;
}) {

  const [banned, setBanned] = useState<boolean>(token.banned);
  const { id, last4chars, issuer, iat, serviceFrom, serviceTo, exp } = token;
  const expirationDate = exp.split('T').reverse().join(' - ');
  const fields = [
    { label: 'Last 4 token characters', value: last4chars },
    { label: 'Issuer', value: issuer },
    { label: 'Issued at', value: iat },
    { label: 'Subject', value: serviceFrom },
    { label: 'Status', value: banned ? 'Banned' : 'Active' },
    { label: 'Audience', value: serviceTo },
    { label: 'Expires at', value: expirationDate },
  ];

  return (
    <TokenDetailsBase
      id={id}
      fields={fields}
      logs={logs}
      logsPending={logsPending}
      logsError={logsError}
      banned={banned}
      setBanned={setBanned}
    />
  );
}

/**
 *
 */
/**
 * Presentational block shared by regular details view and tests.
 */
function TokenDetailsBase({
  id,
  fields,
  logs,
  logsPending,
  logsError,
  banned,
  setBanned }:
{
  id: string;
  fields: { label: string; value: string | undefined }[];
  logs: Log[];
  logsPending: boolean;
  logsError?: string;
  banned: boolean;
  setBanned: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <>
      <h1>Token {id} details</h1>
      {fields.map((f) => (
        <p key={f.label}>
          {f.label}: <strong>{f.value ?? '—'}</strong>
        </p>
      ))}

      <div className="mv2">
        <TokenDetailsWindows
          tokenId={id}
          banned={banned}
          setBanned={setBanned}
        />
      </div>

      <h2>Logs</h2>
      {logsPending && <Spinner size={2} align={'left'} />}
      {!logsPending && logsError && <div><em>Failed to load the logs: {logsError}</em></div>}
      {!logsPending && !logsError && <TokenLogs logs={logs} />}
      <Link to={'/tokens'}>Back to overview</Link>
    </>
  );
}
