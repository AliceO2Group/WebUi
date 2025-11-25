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

import { type Token } from './token';

import { useState } from 'react';
import { Link } from 'react-router';

import { useAuth } from '~/hooks/session';
import ActionBlock from './action-block';
import Modal from '../window/modal';
import Alert from '../window/alert';
import { WindowTitle, WindowContent, WindowButtonCancel, WindowButtonAccept, WindowCloseIcon } from '../window/window-objects';

/**
 * TokenTableBase
 *
 * Reusable token table presentational component.
 *
 * @param {object} props - component props
 * @param {Token[]} props.tokens - array of token records to display
 * @param {{ key: string; label: string; render?: (t: Token) => React.ReactNode }[]} props.columns - column definitions
 * @param {(tokenId: string) => void} props.onActionClick - callback for action clicks
 *
 * Notes:
 * - This component only renders the table.
 * - Columns can provide a custom render function. If not provided the column will render token[col.key].
 */
function TokenTableBase({
  tokens,
  columns,
  onActionClick,
}: {
  tokens: Token[];
  columns: { key: string; label: string; render?: (t: Token) => React.ReactNode }[];
  onActionClick: (tokenId: string) => void;
}) {

const wrappedColumns = columns.map((col) =>
    col.key === 'actions'
      ? {
          ...col,
          render: (t: Token) => <ActionBlock tokenId={t.tokenId} onClick={() => onActionClick(t.tokenId)} />,
        }
      : col
  );

  return (
    <div className="scroll-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token: Token) => (
            <tr key={token.tokenId}>
              {wrappedColumns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(token) : String((token as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * TokenTableContainer
 *
 * Shared container for token table variants: handles modal/alert logic.
 *
 * @param props.tokens - token list
 * @param props.columns - columns definition passed to TokenTableBase
 */
function TokenTableContainer({
  tokens,
  columns,
}: {
  tokens: Token[];
  columns: { key: string; label: string; render?: (t: Token) => React.ReactNode }[];
}) {
  const [openM, setOpenM] = useState<boolean>(false);
  const [openA, setOpenA] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<string>('');
  const auth = useAuth('admin');
  const [key, setKey] = useState<number>(0); // used to force re-mount of Alert

  const successInfo = {
    title: 'Token deleted',
    content: 'Token deleted successfully',
  };

  const failureInfo = {
    title: 'Authorization error',
    content: "You don't have permission to do that operation!",
  };

  const deleteToken = () => {
    if (auth) {
      // eslint-disable-next-line no-console
      console.log(`Deleting token no. ${tokenId}`);
    }
    setKey((prevKey) => prevKey + 1);
    setOpenA(true);
    setTokenId('');
  };

  const onActionClick = (id: string) => {
    setTokenId(id);
    setOpenM(true);
  };

  return (
    <>
      <TokenTableBase tokens={tokens} columns={columns} onActionClick={onActionClick} />

      <Modal open={openM} setOpen={setOpenM} className="bg-primary">
        <WindowTitle>Token delete</WindowTitle>
        <WindowContent>Are you sure you want to delete token with id: {tokenId}?</WindowContent>
        <WindowButtonCancel />
        <WindowCloseIcon />
        <WindowButtonAccept action={deleteToken} className="btn-danger" />
      </Modal>

      <Alert key={key} open={openA} setOpen={setOpenA} className={auth ? 'bg-success white' : 'bg-danger white'} timeout={6000}>
        <WindowTitle>{auth ? successInfo.title : failureInfo.title}</WindowTitle>
        <WindowContent>{auth ? successInfo.content : failureInfo.content}</WindowContent>
        <WindowCloseIcon />
      </Alert>
    </>
  );
}

/**
 * TokenTable
 *
 * Original table using standard columns.
 */
export function TokenTable({ tokens }: { tokens: Token[] }) {
  const columns = [
    { key: 'tokenId', label: 'ID', render: (t: Token) => <Link to={`/tokens/${t.tokenId}`}>{t.tokenId}</Link> },
    { key: 'serviceFrom', label: 'Service From' },
    { key: 'serviceTo', label: 'Service To' },
    { key: 'exp', label: 'Expires at' },
    {
      key: 'actions',
      label: 'Actions',
      render: (t: Token) => <ActionBlock tokenId={t.tokenId} onClick={() => { /* delegated via container */ }} />,
    },
  ];

  // Delegate to container; TokenTableContainer will call onRequestAction internally via same ActionBlock usage pattern.
  return <TokenTableContainer tokens={tokens} columns={columns} />;
}

/**
 * TokenTableWithIssuedAt
 *
 * Variant that adds "Issued at" column.
 */
export function TokenTableWithIssuedAt({ tokens }: { tokens: Token[] }) {
  const columns = [
    { key: 'tokenId', label: 'ID', render: (t: Token) => <Link to={`/tokens/${t.tokenId}`}>{t.tokenId}</Link> },
    { key: 'serviceFrom', label: 'Service From' },
    { key: 'serviceTo', label: 'Service To' },
    { key: 'iat', label: 'Issued at', render: (t: Token) => String((t as any).iat ?? '') },
    { key: 'exp', label: 'Expires at' },
    { key: 'perm', label: 'HTTP Methods', render: (t: Token) => String((t as any).permissions.join(', ') ?? '') },
    {
      key: 'actions',
      label: 'Actions',
      render: (t: Token) => <ActionBlock tokenId={t.tokenId} onClick={() => { /* delegated via container */ }} />,
    },
  ];


  return <TokenTableContainer tokens={tokens} columns={columns} />;
}
