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
import ModalTokenView from './ModalTokenView';
import { useTokenTableFetchers } from '~/feature/token/hooks/token-table';
import useTokenTableModalHandlers from '~/feature/token/hooks/useTokenModalHandlers';
import { useTokenTableAction } from '~/feature/token/hooks/token-table/useTokenTableAction';

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
  const { setOpenA, setAlertVariant } = useTokenTableAction();
  const banFetcher = useTokenTableFetchers('ban');
  const unbanFetcher = useTokenTableFetchers('unban');

  const {handleBan, handleUnban} = useTokenTableModalHandlers(
    setOpenA,
    setAlertVariant,
    banFetcher,
    unbanFetcher,
  );
  
  return (
    <ModalTokenView
      variant={variant}
      open={open}
      setOpen={setOpen}
      tokenId={tokenId}
      onBanConfirm={handleBan}
      onUnbanConfirm={handleUnban}
    />
  );
}
