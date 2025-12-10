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

import { useCallback, useEffect, useState } from 'react';

import { type Token } from '../../types/token';

import { BanBlockSolo,
  BanBlockBulk,
  UnbanBlockSolo,
  UnbanBlockBulk,
} from './ActionBlock';
import { TableBase } from '~/shared/components/table/table-base';
import TokenTableWindows from './TokenTableWindows';
import type { AlertVariant } from '../token-alerts';
import useTokenActions from '../../hooks/api/useTokenActions';
import { useAuth } from '~/feature/auth/hooks/session';
import type { TokenFilterPayload, TokenMutationPayload, TokenMutationResponse } from '../../services/tokenApi';
import { useTokenFiltersState } from '../../hooks/token-filters';

type ColumnDefinition = {
  key: string;
  label: string | (() => React.ReactNode);
  render?: (t: Token) => React.ReactNode;
};

type BaseContainerProps = {
  tokens: Token[];
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  columns: ColumnDefinition[];
  filtered?: boolean;
  appliedFilters?: TokenFilterPayload | null;
};

type PublicContainerProps = Omit<BaseContainerProps, 'appliedFilters'>;

type ExtendedContainerProps = Omit<PublicContainerProps, 'filtered'> & { filtered: boolean };

function TokenTableContainerBase({
  tokens,
  columns,
  filtered = false,
  setTokens,
  appliedFilters = null,
}: BaseContainerProps) {

  const auth = useAuth('admin');
  const {
    ban,
    unban,
  } = useTokenActions();

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [modalVariant, setModalVariant] = useState<'ban' | 'unban' | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [alertVariant, setAlertVariant] = useState<AlertVariant>('token-banned-success');
  const [isAlertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      setModalVariant(null);
      setSelectedTokenId(null);
    }
  }, [isModalOpen, setModalVariant, setSelectedTokenId]);

  const showAuthError = useCallback(() => {
    setAlertVariant('auth-error');
    setAlertOpen(true);
  }, [setAlertVariant, setAlertOpen]);

  const applyTokenStatus = useCallback((targetId: string, banned: boolean, data?: TokenMutationResponse) => {
    const isBulkUpdate = data?.bulk ?? targetId === 'bulk';

    setTokens((prevTokens) => {
      if (isBulkUpdate) {
        return prevTokens.map((token) => ({ ...token, banned }));
      }

      return prevTokens.map((token) => token.id === targetId ? { ...token, banned } : token);
    });
  }, [setTokens]);

  const buildPayload = useCallback((id: string): TokenMutationPayload => {
    const payload: TokenMutationPayload = { tokenId: id };
    if (id === 'bulk' && appliedFilters) {
      payload.filterInfo = appliedFilters;
    }
    return payload;
  }, [appliedFilters]);

  const handleBanConfirm = useCallback((id: string) => {
    if (!auth) {
      showAuthError();
      return;
    }

    const payload = buildPayload(id);
    ban.mutate(payload, {
      onSuccess: (data) => {
        applyTokenStatus(id, true, data);
        setAlertVariant('token-banned-success');
        setAlertOpen(true);
      },
      onError: () => {
        setAlertVariant('token-banned-failed');
        setAlertOpen(true);
      },
    });
  }, [auth, ban, buildPayload, applyTokenStatus, showAuthError]);

  const handleUnbanConfirm = useCallback((id: string) => {
    if (!auth) {
      showAuthError();
      return;
    }

    const payload = buildPayload(id);
    unban.mutate(payload, {
      onSuccess: (data) => {
        applyTokenStatus(id, false, data);
        setAlertVariant('token-unbanned-success');
        setAlertOpen(true);
      },
      onError: () => {
        setAlertVariant('token-unbanned-failed');
        setAlertOpen(true);
      },
    });
  }, [auth, unban, buildPayload, applyTokenStatus, showAuthError]);

  const bulkActionsDisabled = !filtered || !appliedFilters;

  const onActionClick = (id: string, variant: 'ban' | 'unban') => {
    setSelectedTokenId(id);
    setModalVariant(variant);
    setModalOpen(true);
  };

  function labelWithBulkActions() {
    return <div className="flex-row g1">
      <span>Actions</span>
      <BanBlockBulk onClick={() => onActionClick('bulk', 'ban')} disabled={bulkActionsDisabled} />
      <UnbanBlockBulk onClick={() => onActionClick('bulk', 'unban')} disabled={bulkActionsDisabled} />
    </div>;
  }

  function renderActionBlock(t: Token) {
    if (t.banned) {
      return <UnbanBlockSolo onClick={() => onActionClick(t.id, 'unban')} />;
    }
    return <BanBlockSolo onClick={() => onActionClick(t.id, 'ban')} />;
  }

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
      <TokenTableWindows
        tokenId={selectedTokenId}
        modalVariant={modalVariant}
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        alertVariant={alertVariant}
        isAlertOpen={isAlertOpen}
        setAlertOpen={setAlertOpen}
        onBanConfirm={handleBanConfirm}
        onUnbanConfirm={handleUnbanConfirm}
      />
    </>
  );
}

export function TokenTableContainer(props: PublicContainerProps) {
  return <TokenTableContainerBase {...props} appliedFilters={null} />;
}

export function TokenTableExtendedContainer({ filtered, ...rest }: ExtendedContainerProps) {
  const { appliedFilters } = useTokenFiltersState();
  return <TokenTableContainerBase {...rest} filtered={filtered} appliedFilters={appliedFilters} />;
}
