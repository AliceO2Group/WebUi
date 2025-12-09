import { Await, Link } from 'react-router';
import { Suspense, useState } from 'react';

import type { Log } from '~/feature/token/types/log';
import type { Token } from '~/feature/token/types/token';

import { TokenLogs } from '~/feature/token/components/token-logs';
import { Spinner } from '~/ui/spinner';
import TokenDetailsWindows from './TokenDetailsWindows';

export default function TokenDetails({ 
  token, 
  setToken,
  logs 
}: { 
  token: Token;
  setToken: React.Dispatch<React.SetStateAction<Token>>; 
  logs: Promise<Log[]> 
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
      banned={banned}
      setBanned={setBanned}
    />
  );
}

function TokenDetailsBase({ 
  id, 
  fields, 
  logs, 
  banned, 
  setBanned }: 
  { 
    id: string; 
    fields: { label: string; value: string | undefined }[]; 
    logs: Promise<Log[]>; 
    banned: boolean; 
    setBanned: React.Dispatch<React.SetStateAction<boolean>> 
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
      <Suspense fallback={<Spinner size={2} align={'left'} />}>
        <Await resolve={logs} errorElement={<div><em>Failed to load the logs</em></div>}>
          {(logs) => <TokenLogs logs={logs} />}
        </Await>
      </Suspense>
      <Link to={'/tokens'}>Back to overview</Link>
    </>
  );
}