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
import type { Token } from '../../types/token';

import { useEffect } from 'react';

import type { AlertVariant } from './token-table-alerts';
import ModalToken from '~/feature/token/components/token-table/token-table-modals';
import TokenAlert from './token-table-alerts';
import { useTokenTableState,
  useTokenTableAction,
  useTokenTableFetchers,
} from '~/feature/token/hooks/token-table';


/**
 *
 */
export default function TokenTableWindows({
  setTokens
}: {
  setTokens: React.Dispatch<React.SetStateAction<Token[]>>
}) {

  const {
    openA,
    openM,
    tokenId,
    modalVariant,
    alertVariant
  } = useTokenTableState();
  const {
    setOpenA,
    setOpenM,
    setAlertVariant
  } = useTokenTableAction();

  const banFetcher = useTokenTableFetchers('ban')
  const unbanFetcher = useTokenTableFetchers('unban')

  // TODO: if pagination is implemented we need to update all pages, not only current one
  useEffect(() => {
    if(banFetcher.state === 'idle' && banFetcher.data) {
      const success = !!((banFetcher.data as any)?.success);
      const bulk = (banFetcher.data as any)?.bulk;
      if(success) {
        setAlertVariant('token-banned-success');
        if(bulk) {
          setTokens((prevTokens) => prevTokens.map((t) => ({ ...t, banned: true })));
        } else {
          setTokens((prevTokens) => prevTokens.map((t) => t.id === tokenId ? { ...t, banned: true } : t));
        }
      } else {
        setAlertVariant('token-banned-failed');
      }
      setOpenA(true);
    }
  }, [banFetcher.state, banFetcher.data]);

  // TODO: if pagination is implemented we need to update all pages, not only current one
  useEffect(() => {
    if(unbanFetcher.state === 'idle' && unbanFetcher.data) {
      const success = !!((unbanFetcher.data as any)?.success);
      const bulk = (unbanFetcher.data as any)?.bulk;
      if(success) {
        setAlertVariant('token-unbanned-success');
        if(bulk) {
          setTokens((prevTokens) => prevTokens.map((t) => ({ ...t, banned: false })));
        } else {
          setTokens((prevTokens) => prevTokens.map((t) => t.id === tokenId ? { ...t, banned: false } : t));
        }
      } else {
        setAlertVariant('token-unbanned-failed');
      }
      setOpenA(true);
    }
  }, [unbanFetcher.state, unbanFetcher.data]);

  return <>
    <ModalToken tokenId={tokenId} open={openM} setOpen={setOpenM} variant={modalVariant as 'ban' | 'unban'} />
    <TokenAlert open={openA} setOpen={setOpenA} variant={alertVariant as AlertVariant} />
  </>;
}
