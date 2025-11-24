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

import { type Token } from './token';

import { useState } from 'react';
import { Link } from 'react-router';

import { useAuth } from '~/hooks/session';
import ActionBlock from './action-block';
import Modal  from '../window/modal';
import Alert from '../window/alert';
import { WindowTitle, WindowContent, WindowButtonCancel, WindowButtonAccept, WindowCloseIcon } from '../window/window-objects';

/**
 * TokenTableHeader
 *
 * Renders the static table header row for the token table.
 *
 * Notes:
 * - No props.
 * - Small, non-reusable helper.
 */
function TokenTableHeader() {
  const theaders = ['ID', 'Service From', 'Service To', 'Expires at', 'Actions'];
  return (
    <thead>
      <tr>
        {theaders.map((el) => <th key={el}>{el}</th>)}
      </tr>
    </thead>
  );
}

/**
 * TokenTableContent
 *
 * Renders table body rows for the provided tokens.
 *
 * @param {object} props - component props
 * @param {Token[]} props.tokens - array of token records to display
 * @param {(val: string) => void} props.actionBlockOnClick - callback invoked with tokenId when action button clicked
 *
 * Notes:
 * - Simple rendering helper; not a generic reusable component.
 */
function TokenTableContent({ tokens, actionBlockOnClick }: { tokens: Token[]; actionBlockOnClick: (val: string) => void }) {
  return (
    <>
      <tbody>
        {tokens.map((token: Token) => (
          <tr key={token.tokenId}>
            <td><Link to={`/tokens/${token.tokenId}`}>{token.tokenId}</Link></td>
            <td>{token.serviceFrom}</td>
            <td>{token.serviceTo}</td>
            <td>{token.exp}</td>
            <td>
              <ActionBlock
                tokenId={token.tokenId}
                onClick={() => actionBlockOnClick(token.tokenId)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
}

/**
 * TokenTable
 *
 * Table wrapper that manages modal/alert UI for token actions.
 *
 * @param {object} props - component props
 * @param {Token[]} props.tokens - tokens to display in the table
 *
 * Notes:
 * - Manages local state for delete confirmation and result alert.
 * - Intentionally small and application-specific (not designed as a reusable library component).
 */
export function TokenTable({ tokens }: { tokens: Token[] }) {
  const [openM, setOpenM] = useState<boolean>(false); // Used for modal logic
  const [openA, setOpenA] = useState<boolean>(false); // Used for alert logic
  const [tokenId, setTokenId] = useState<string>('');
  const auth = useAuth('admin');

  const successInfo = {
    title: 'Token deleted',
    content: 'Token deleted successfully',
  };

  const failureInfo = {
    title: 'Token wasn\'t deleted',
    content: 'You don\'t have permission to do that operation!',
  };

  // Will be used for API call
  const deleteToken = () => {
    if (auth) {
      // eslint-disable-next-line no-console
      console.log(`Deleting token no. ${tokenId}`);
    }
    setOpenA(true);
    setTokenId('');
  };

  // Prop for TokenTableContent
  const actionBlockOnClick = (val: string) => {
    setTokenId(val); setOpenM(true);
  };

  return <>
    <div className='scroll-auto'>
      <table className='table'>
        <TokenTableHeader />
        <TokenTableContent tokens={tokens} actionBlockOnClick={actionBlockOnClick} />
      </table>
    </div>
    <Modal
      open={openM}
      setOpen={setOpenM}
      className="bg-primary"
    >
      <WindowTitle>Token delete</WindowTitle>
      <WindowContent>
        Are you sure you want to delete token with id: {tokenId}?
      </WindowContent>
      <WindowButtonCancel/>
      <WindowCloseIcon/>
      <WindowButtonAccept action={deleteToken} className="btn-danger"/>
    </Modal>
    <Alert
      open={openA}
      setOpen={setOpenA}
      className={auth ? 'bg-success white' : 'bg-danger white'}
      timeout={5000}
    >
      <WindowTitle>{auth ? successInfo.title : failureInfo.title}</WindowTitle>
      <WindowContent>{auth ? successInfo.content : failureInfo.content}</WindowContent>
      <WindowCloseIcon/>
    </Alert>
  </>;
}
