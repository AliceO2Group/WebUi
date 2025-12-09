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

import { type DialogPropsBase } from '~/utils/types';
import { TokenModalBan, TokenModalBanBulk } from './TokenModalBan';
import { TokenModalUnban, TokenModalUnbanBulk } from './TokenModalUnban';
import { useAuth } from '~/feature/auth/hooks/session';
import { getStorageItem } from '~/utils/storage';
import { useTokenTableAction, useTokenTableFetchers } from '~/feature/token/hooks/token-table';

const MODAL_COMPONENTS = {
  'ban': TokenModalBan,
  'unban': TokenModalUnban,
};

const MODAL_COMPONENTS_BULK = {
  'ban': TokenModalBanBulk,
  'unban': TokenModalUnbanBulk,
};

/**
 *
 */
export default function ModalToken({
  variant,
  open,
  setOpen,
  tokenId,
}: {
  variant: 'ban' | 'unban';
  tokenId: string;
} & DialogPropsBase,
) {
  const auth = useAuth('admin');
  const { setOpenA, setAlertVariant } = useTokenTableAction();
  const banFetcher = useTokenTableFetchers('ban');
  const unbanFetcher = useTokenTableFetchers('unban');

  const handleBan = (id: string) => {
    if (id === 'bulk') {
      const fd = new FormData();
      const filterInfo = getStorageItem('TKN_token-filters');
      if (filterInfo) {
        fd.append('filterInfo', filterInfo);
      }
      fd.append('tokenId', 'bulk');
      banFetcher.submit(fd, { method: 'post', action: '/tokens/ban' });
      return;
    }
    if (auth) {
      banFetcher.submit({ tokenId: id }, { method: 'post', action: '/tokens/ban' });
    } else {
      setAlertVariant('auth-error');
      setOpenA(true);
    }
  };

  const handleUnban = (id: string) => {
    if (id === 'bulk') {
      const fd = new FormData();
      const filterInfo = getStorageItem('TKN_token-filters');
      if (filterInfo) {
        fd.append('filterInfo', filterInfo);
      }
      fd.append('tokenId', 'bulk');
      unbanFetcher.submit(fd, { method: 'post', action: '/tokens/unban' });
      return;
    }
    if (auth) {
      unbanFetcher.submit({ tokenId: id }, { method: 'post', action: '/tokens/unban' });
    } else {
      setAlertVariant('auth-error');
      setOpenA(true);
    }
  };
  // Guard: if variant is falsy or not present in the map, don't attempt to call it
  if (!variant) {
    return null;
  }

  if (tokenId === 'bulk') {
    const Comp = MODAL_COMPONENTS_BULK[variant];
    if (!Comp) {
      return null;
    }
    return variant === 'ban'
      ? <Comp open={open} setOpen={setOpen} onConfirm={() => handleBan('bulk')} />
      : <Comp open={open} setOpen={setOpen} onConfirm={() => handleUnban('bulk')} />;
  }

  const Comp = MODAL_COMPONENTS[variant];
  if (!Comp) {
    return null;
  }
  return variant === 'ban'
    ? <Comp open={open} setOpen={setOpen} tokenId={tokenId} onConfirm={() => handleBan(tokenId)} />
    : <Comp open={open} setOpen={setOpen} tokenId={tokenId} onConfirm={() => handleUnban(tokenId)} />;
}
