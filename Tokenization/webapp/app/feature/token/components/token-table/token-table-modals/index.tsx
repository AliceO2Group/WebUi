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
  // Guard: if variant is falsy or not present in the map, don't attempt to call it
  if (!variant) return null;

  if (tokenId === 'bulk') {
    const Comp = MODAL_COMPONENTS_BULK[variant];
    return Comp ? <Comp open={open} setOpen={setOpen} /> : null;
  }

  const Comp = MODAL_COMPONENTS[variant];
  return Comp ? <Comp open={open} setOpen={setOpen} tokenId={tokenId} /> : null;
}
