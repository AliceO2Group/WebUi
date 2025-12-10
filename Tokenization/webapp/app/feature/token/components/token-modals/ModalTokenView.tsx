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

import React from 'react';
import { TokenModalBan, TokenModalBanBulk } from './TokenModalBan';
import { TokenModalUnban, TokenModalUnbanBulk } from './TokenModalUnban';

type Variant = 'ban' | 'unban' | null | undefined;

type Props = {
  variant: Variant;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  tokenId: string | null;
  onBanConfirm: (id: string) => void;
  onUnbanConfirm: (id: string) => void;
};

/**
 *
 */
export default function ModalTokenView({ variant, open, setOpen, tokenId, onBanConfirm, onUnbanConfirm }: Props) {
  if (!variant) {
    return null;
  }

  if (tokenId === 'bulk') {
    const onConfirm = () => onBanConfirm('bulk');
    if (variant === 'ban') {
      return <TokenModalBanBulk open={open} setOpen={setOpen} onConfirm={() => onBanConfirm('bulk')} />;
    }
    return <TokenModalUnbanBulk open={open} setOpen={setOpen} onConfirm={() => onUnbanConfirm('bulk')} />;
  }

  if (!tokenId) {
    return null;
  }

  if (variant === 'ban') {
    return <TokenModalBan open={open} setOpen={setOpen} tokenId={tokenId} onConfirm={() => onBanConfirm(tokenId)} />;
  }

  return <TokenModalUnban open={open} setOpen={setOpen} tokenId={tokenId} onConfirm={() => onUnbanConfirm(tokenId)} />;
};
