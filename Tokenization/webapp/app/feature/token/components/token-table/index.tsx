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
import { type Token } from '../../types/token';

import { TokenTableProvider } from '../../contexts/token-table';
import { TokenTableContainer } from './TokenTableContainer';

// Common columns for all table variants
const columns = [
  { key: 'id', label: 'ID', render: (t: Token) => <Link to={`/tokens/${t.id}`}>{t.id}</Link> },
  { key: 'serviceFrom', label: 'Service From' },
  { key: 'serviceTo', label: 'Service To' },
  { key: 'exp', label: 'Expires at' },
  { key: 'status', label: 'Status', render: (t: Token) => (t.banned ? 'Revoked' : 'Active') },
  {
    key: 'actions',
    label: 'Actions',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render: (t: Token) => (null),
  },
];

// Extended columns for TokenTableExtended variant
const columns_extended = [
  ...columns.slice(0, 5),
  { key: 'iat', label: 'Issued at', render: (t: Token) => String((t as any).iat ?? '') },
  { key: 'perm', label: 'HTTP Methods', render: (t: Token) => String((t as any).permissions.join(', ') ?? '') },
  {
    key: 'actions',
    label: () => 'Actions', // Updated in TableContainer
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render: (t: Token) => (null), // Updated in TableContainer
  },
];

interface TokenTableProps {
  tokens: Token[];
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
}

/**
 * TokenTable
 *
 * Original table using standard columns.
 * @param props.tokens - token list
 */
export function TokenTable({ tokens, setTokens }: TokenTableProps) {
  // Delegate to container; TokenTableContainer will call onRequestAction internally via same ActionBlock usage pattern.
  return <TokenTableProvider>
    <TokenTableContainer tokens={tokens} setTokens={setTokens} columns={columns} />
  </TokenTableProvider>;
}

/**
 * TokenTableWithExtended
 *
 * Variant that adds "Issued at" and "HTTP Methods (permissions)" columns.
 * @param props.tokens - token list
 */
export function TokenTableExtended({ tokens, setTokens, filtered }: TokenTableProps & { filtered: boolean }) {
  return <TokenTableProvider>
    <TokenTableContainer tokens={tokens} setTokens={setTokens} columns={columns_extended} filtered={filtered} />;
  </TokenTableProvider>;
}
