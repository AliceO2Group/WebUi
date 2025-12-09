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

import { type Token } from '../../types/token';

import { BanBlockSolo,
  BanBlockBulk,
  UnbanBlockSolo,
  UnbanBlockBulk,
} from './ActionBlock';
import { TableBase } from '~/shared/components/table/table-base';
import { useTokenTableAction } from '../../hooks/token-table';
import TokenTableWindows from './TokenTableWindows';

/**
 * TokenTableContainer
 *
 * Shared container for token table variants: handles modal/alert logic.
 *
 * @param props.tokens - token list
 * @param props.columns - columns definition passed to TokenTableBase
 */
export function TokenTableContainer({
  tokens,
  columns,
  filtered,
  setTokens,
}: {
  tokens: Token[];
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  columns: { key: string; label: string | (() => React.ReactNode);
    render?: (t: Token) => React.ReactNode; }[];
  filtered?: boolean;
}) {

  const { setTokenId, setOpenM, setModalVariant } = useTokenTableAction();

  // Onclick handler for both bulk and solo action blocks
  const onActionClick = (id: string, variant: string) => {
    setTokenId(id);
    setModalVariant(variant);
    setOpenM(true);
  };

  /**
   *
   */
  function labelWithBulkActions() {
    return <div className="flex-row g1">
      <span>Actions</span>
      <BanBlockBulk onClick={() => onActionClick('bulk', 'ban')} disabled={!filtered} />
      <UnbanBlockBulk onClick={() => onActionClick('bulk', 'unban')} disabled={!filtered} />
    </div>;
  }

  /**
   *
   */
  function renderActionBlock(t: Token) {
    if (t.banned) {
      return <UnbanBlockSolo onClick={() => onActionClick(t.id, 'unban')} />;
    }
    return <BanBlockSolo onClick={() => onActionClick(t.id, 'ban')} />;
  }

  // Wrap columns to inject ActionBlock components with proper handlers for bulk and solo actions
  const wrappedColumns = columns.map((col) =>
    col.key === 'actions'
      ? {
        ...col,
        label: typeof col.label === 'function' ? labelWithBulkActions : col.label,
        render: renderActionBlock,
      }
      : col,
  );

  const tokensWithStyle = tokens.map((t: Token) => ({
    ...t,
    className: t.banned ? 'bg-warning' : '',
  }));

  return (
    <>
      <TableBase<Token> data={tokensWithStyle} columns={wrappedColumns} />
      <TokenTableWindows setTokens={setTokens} />
    </>
  );
}
