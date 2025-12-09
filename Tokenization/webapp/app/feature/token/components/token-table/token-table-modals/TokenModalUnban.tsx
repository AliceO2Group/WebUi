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

import type { DialogPropsBase } from '~/utils/types';
import { ModalBase } from '~/shared/components/modals/modal-base';

/**
 *
 */
export function TokenModalUnban({
  open,
  setOpen,
  tokenId,
  onConfirm
}: {
  tokenId: string;
  onConfirm: () => void;
} & DialogPropsBase) {

  const MODAL_CONTENT = {
    title: 'Token Unban',
    content: `Are you sure you want to unban the token with ID ${tokenId}? `,
    accent: 'bg-success',
    action: onConfirm
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
export function TokenModalUnbanBulk({
  open,
  setOpen,
  onConfirm
}: {onConfirm: () => void;} 
& DialogPropsBase,
) {

  const MODAL_CONTENT = {
    title: 'Tokens Unban',
    content: 'Are you sure you want to unban ALL FILTERED tokens? Check the filter settings before proceeding.',
    accent: 'bg-success',
    action: onConfirm
  };

  return <ModalBase
    open={open}
    setOpen={setOpen}
    modal={MODAL_CONTENT}
  />;
}
