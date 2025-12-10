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

import { useCallback, useState } from 'react';

import { TokenModalBan } from '~/feature/token/components/token-modals/TokenModalBan';
import { TokenModalUnban } from '~/feature/token/components/token-modals/TokenModalUnban';
import TokenAlert, { type AlertVariant } from '~/feature/token/components/token-alerts';
import useTokenActions from '../../hooks/api/useTokenActions';
import { useAuth } from '~/feature/auth/hooks/session';

type Props = {
  tokenId: string;
  banned: boolean;
  setBanned: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 *
 */
export default function TokenDetailsWindows({ tokenId, banned, setBanned }: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertVariant, setAlertVariant] = useState<AlertVariant>('token-banned-success');

  const {
    ban,
    unban,
  } = useTokenActions();
  const auth = useAuth('admin');

  const openConfirm = () => setOpenModal(true);

  const showAlert = useCallback((variant: AlertVariant) => {
    setAlertVariant(variant);
    setAlertOpen(true);
  }, [setAlertOpen, setAlertVariant]);

  const handleBanConfirm = useCallback(() => {
    if (!auth) {
      showAlert('auth-error');
      return;
    }

    ban.mutate({ tokenId }, {
      onSuccess: () => {
        setBanned(true);
        showAlert('token-banned-success');
      },
      onError: () => {
        showAlert('token-banned-failed');
      },
    });
  }, [auth, ban, tokenId, setBanned, showAlert]);

  const handleUnbanConfirm = useCallback(() => {
    if (!auth) {
      showAlert('auth-error');
      return;
    }

    unban.mutate({ tokenId }, {
      onSuccess: () => {
        setBanned(false);
        showAlert('token-unbanned-success');
      },
      onError: () => {
        showAlert('token-unbanned-failed');
      },
    });
  }, [auth, unban, tokenId, setBanned, showAlert]);

  return (
    <>
      {banned ? (
        <button className="btn btn-primary" onClick={openConfirm}>Unban token</button>
      ) : (
        <button className="btn btn-danger" onClick={openConfirm}>Ban token</button>
      )}

      {/* Modal: reuse presentational modal components and pass onConfirm that executes fetcher */}
      {banned ? (
        <TokenModalUnban open={openModal} setOpen={setOpenModal} tokenId={tokenId} onConfirm={() => {
          handleUnbanConfirm();
          setOpenModal(false);
        }} />
      ) : (
        <TokenModalBan open={openModal} setOpen={setOpenModal} tokenId={tokenId} onConfirm={() => {
          handleBanConfirm();
          setOpenModal(false);
        }} />
      )}

      <TokenAlert variant={alertVariant} open={alertOpen} setOpen={setAlertOpen} />
    </>
  );
}
