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

import { type Token } from '../types/token';

import { useState } from 'react';
import { Link } from 'react-router';

import { useAuth } from '~/feature/auth/hooks/session';
import { ActionBlockSolo, ActionBlockBulk } from './action-block';
import Modal from '~/shared/components/window/modal';
import Alert from '~/shared/components/window/alert';
import { WindowTitle,
  WindowContent,
  WindowButtonCancel,
  WindowButtonAccept,
  WindowCloseIcon } from '~/shared/components/window/window-objects';
import { TableBase } from '../../../shared/components/table/table-base';

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
}: {
  tokens: Token[];
  columns: { key: string; label: string | (() => React.ReactNode); render?: (t: Token) => React.ReactNode }[];
}) {

  return (
    <div className="scroll-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{typeof c.label === 'function' ? c.label() : c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tokens.map((token: Token) => (
            <tr key={token.tokenId}>
              {columns.map((col) => (
                <td key={col.key}>
                  { }
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

const successInfo = {
  title: 'Token(s) deleted',
  content: 'Token(s) deleted successfully',
};

const failureInfo = {
  title: 'Authorization error',
  content: "You don't have permission to do that operation!",
};

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
  columns: { key: string; label: string | (() => React.ReactNode); render?: (t: Token) => React.ReactNode }[];
}) {
  const [openM, setOpenM] = useState<boolean>(false);
  const [openA, setOpenA] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<string>('');
  const auth = useAuth('admin');
  const [key, setKey] = useState<number>(0); // Used to force re-mount of Alert component

  const deleteToken = () => {
    if (auth) {
      // eslint-disable-next-line no-console
      console.log(`Deleting token no. ${tokenId}`);
    }
    setKey((prevKey) => prevKey + 1);
    setOpenA(true);
    setTokenId('');
  };

  const [windowContent, setWindowContent] = useState<string>('');

  // Onclick handler for both bulk and solo action blocks
  const onActionClick = (id: string) => {
    if ( id === 'bulk') {
      setWindowContent('Are you sure you want to delete ALL FILTERED tokens? Check filtering before proceeding.');
    } else {
      setTokenId(id);
      setWindowContent(`Are you sure you want to delete token with id: ${id}?`);
    }
    setOpenM(true);
  };

  // Wrap columns to inject ActionBlock components with proper handlers for bulk and solo actions
  const wrappedColumns = columns.map((col) =>
    col.key === 'actions'
      ? {
        ...col,
        label: typeof col.label === 'function'
          ? () => <div className="flex-row g1"><span>Actions</span><ActionBlockBulk onClick={() => onActionClick('bulk')} /></div>
          : col.label,
        render: (t: Token) => <ActionBlockSolo onClick={() => onActionClick(t.id)} />,
      }
      : col,
  );

  return (
    <>
      <TokenTableBase tokens={tokens} columns={wrappedColumns} />
      <Modal open={openM} setOpen={setOpenM} className="bg-primary">
        <WindowTitle>Token delete</WindowTitle>
        <WindowContent>{windowContent}</WindowContent>
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

// Common columns for all table variants
const columns = [
  { key: 'id', label: 'ID', render: (t: Token) => <Link to={`/tokens/${t.id}`}>{t.id}</Link> },
  { key: 'serviceFrom', label: 'Service From' },
  { key: 'serviceTo', label: 'Service To' },
  { key: 'exp', label: 'Expires at' },
  {
    key: 'actions',
    label: 'Actions',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render: (t: Token) => (null),
  },
];

/**
 * TokenTable
 *
 * Original table using standard columns.
 * @param props.tokens - token list
 */
export function TokenTable({ tokens }: { tokens: Token[] }) {
  // Delegate to container; TokenTableContainer will call onRequestAction internally via same ActionBlock usage pattern.
  return <TokenTableContainer tokens={tokens} columns={columns} />;
}

/**
 * TokenTableWithIssuedAt
 *
 * Variant that adds "Issued at" and "HTTP Methods (permissions)" columns.
 * @param props.tokens - token list
 */
export function TokenTableExtended({ tokens }: { tokens: Token[] }) {
  const columns_extended = [
    ...columns.slice(0, 4),
    { key: 'iat', label: 'Issued at', render: (t: Token) => String((t as any).iat ?? '') },
    { key: 'perm', label: 'HTTP Methods', render: (t: Token) => String((t as any).permissions.join(', ') ?? '') },
    {
      key: 'actions',
      label: () => (null), // Updated in TableContainer
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      render: (t: Token) => (null), // Updated in TableContainer
    },
  ];

  return <TokenTableContainer tokens={tokens} columns={columns_extended} />;
}
