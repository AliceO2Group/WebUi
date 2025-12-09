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

import ModalToken from '~/feature/token/components/token-table/token-table-modals';
import Alert from '~/shared/components/window/alert';
import { WindowTitle,
  WindowContent,
  WindowCloseIcon,
} from '~/shared/components/window/window-objects';
import { useAuth } from '~/feature/auth/hooks/session';
import { useTokenTableState,
  useTokenTableAction,
} from '~/feature/token/hooks/token-table';

const successInfo = {
  title: 'Token(s) deleted',
  content: 'Token(s) deleted successfully',
};

const failureInfo = {
  title: 'Authorization error',
  content: "You don't have permission to do that operation!",
};

/**
 *
 */
export default function TokenTableWindows() {
  const {
    openA,
    openM,
    tokenId,
    modalVariant,
    key,
  } = useTokenTableState();
  const {
    setOpenA,
    setOpenM,
  } = useTokenTableAction();

  const auth = useAuth('admin');

  return <>
    <ModalToken tokenId={tokenId} open={openM} setOpen={setOpenM} variant={modalVariant as 'ban' | 'unban'} />

    <Alert key={key} open={openA} setOpen={setOpenA} className={auth ? 'bg-success white' : 'bg-danger white'} timeout={6000}>
      <WindowTitle>{auth ? successInfo.title : failureInfo.title}</WindowTitle>
      <WindowContent>{auth ? successInfo.content : failureInfo.content}</WindowContent>
      <WindowCloseIcon />
    </Alert>
  </>;
}
