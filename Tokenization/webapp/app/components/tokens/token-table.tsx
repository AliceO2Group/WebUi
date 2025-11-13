import { type PropsWithChildren } from "react";
import { type Token } from "./token";

import { useState } from "react";
import { Link } from "react-router";

import { useAuth } from "~/hooks/session";
import ActionBlock from "./action-block";
import { Modal, ModalTitle, ModalContent, ModalButtonCancel, ModalButtonAccept } from "../modal";


export function TokenTable({children}: PropsWithChildren) {
  const theaders = ['ID', 'Service From', 'Service To', 'Expires at', 'Actions'];
   return <div className='scroll-auto'>
      <table className='table'>
        <thead>
          <tr>
            {theaders.map((content, index) => <th key={index}>{content}</th>)}
          </tr>
        </thead>
        {children} 
      </table>
  </div>
}


// Will be changed in next PR
/**
 * Table component that displays a list of tokens with their ID and validity.
 * Token IDs are clickable links that navigate to the token details page.
 *
 * @param tokens - Array of tokens to display
 */
export function TokenTableContent({ tokens }: { tokens: Token[] }) {
  const [open, setOpen] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<string>('');

  const auth = useAuth('admin');

  const deleteToken = () => {
    if(auth) {
      console.log(`Deleting token no. ${tokenId}`)
    }
    setTokenId('')
  }
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
                  onClick={() => {setTokenId(token.tokenId); setOpen(true);}}
                />
              </td>
            </tr>
          ))}
        </tbody>

      <Modal
        open={open}
        setOpen={setOpen}
        className="bg-primary"
        >
        <ModalTitle>Token delete</ModalTitle>
        <ModalContent>
          Are you sure you want to delete token with id: {tokenId}?
        </ModalContent>
        <ModalButtonCancel/>
        <ModalButtonAccept action={deleteToken} className="btn-danger"/>
      </Modal>
    </>
  );
}