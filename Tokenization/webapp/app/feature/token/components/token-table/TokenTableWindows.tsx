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
import ModalToken from '~/feature/token/components/token-modals';
import TokenAlert, { type AlertVariant } from '../token-alerts';

type TokenTableWindowsProps = {
  tokenId: string | null;
  modalVariant: 'ban' | 'unban' | null;
  isModalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  alertVariant: AlertVariant;
  isAlertOpen: boolean;
  setAlertOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onBanConfirm: (tokenId: string) => void;
  onUnbanConfirm: (tokenId: string) => void;
};

/**
 * Glue component that renders token modals and alerts based on container state.
 */
export default function TokenTableWindows({
  tokenId,
  modalVariant,
  isModalOpen,
  setModalOpen,
  alertVariant,
  isAlertOpen,
  setAlertOpen,
  onBanConfirm,
  onUnbanConfirm,
}: TokenTableWindowsProps) {
  return <>
    <ModalToken
      tokenId={tokenId}
      open={isModalOpen}
      setOpen={setModalOpen}
      variant={modalVariant}
      onBanConfirm={onBanConfirm}
      onUnbanConfirm={onUnbanConfirm}
    />
    <TokenAlert open={isAlertOpen} setOpen={setAlertOpen} variant={alertVariant} />
  </>;
}
