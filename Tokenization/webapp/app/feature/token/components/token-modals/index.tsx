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
import ModalTokenView from './ModalTokenView';

type ModalTokenProps = {
  variant: 'ban' | 'unban' | null;
  tokenId: string | null;
  onBanConfirm: (tokenId: string) => void;
  onUnbanConfirm: (tokenId: string) => void;
} & DialogPropsBase;

/**
 * Thin wrapper that wires dialog props to the shared ModalTokenView component.
 */
export default function ModalToken({
  variant,
  open,
  setOpen,
  tokenId,
  onBanConfirm,
  onUnbanConfirm,
}: ModalTokenProps) {
  return (
    <ModalTokenView
      variant={variant}
      open={open}
      setOpen={setOpen}
      tokenId={tokenId}
      onBanConfirm={onBanConfirm}
      onUnbanConfirm={onUnbanConfirm}
    />
  );
}
