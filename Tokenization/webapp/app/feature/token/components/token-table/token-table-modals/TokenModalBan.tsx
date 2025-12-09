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

import { ModalBase } from '~/shared/components/modals/modal-base';
import type { DialogPropsBase } from '~/utils/types';

/**
 *
 */
export function TokenModalBan({
  open,
  setOpen,
  tokenId,
}: {
  tokenId: string;
} & DialogPropsBase) {

  const BanToken = () => {
    
  }

  const MODAL_CONTENT = {
    title: 'Token Ban',
    content: `Are you sure you want to ban the token with ID ${tokenId}? `,
    accent: 'bg-danger',
    action: BanToken
  };

  return <ModalBase
    open={open}
    setOpen={setOpen}
    modal={MODAL_CONTENT}
  />;
}

/**
 *
 */
export function TokenModalBanBulk({
  open,
  setOpen,
}: DialogPropsBase,
) {

  // will need to get filter info from parent to show in content
  const BanTokenBulk = () => {
  
  }

  const MODAL_CONTENT = {
    title: 'Token Ban',
    content: 'Are you sure you want to ban ALL FILTERED tokens? Check the filter settings before proceeding.',
    accent: 'bg-danger',
    action: BanTokenBulk
  };

  return <ModalBase
    open={open}
    setOpen={setOpen}
    modal={MODAL_CONTENT}
  />;
}
