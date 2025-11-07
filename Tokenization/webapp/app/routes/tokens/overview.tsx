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
import type { Route } from './+types/overview';
import type { Token } from '../../components/tokens/token';

import { Link } from 'react-router';
import { useState } from 'react';
import { Tab, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material'

import {Box} from "../../components/box"
import ActionBlock from '~/components/tokens/action-block';
import { useSetHeader } from '~/ui/header/headerContext';
import { useAuth } from '~/hooks/session';

/**
 * Client loader that fetches all tokens from the API.
 *
 * @returns Promise that resolves to an array of tokens
 */
export const clientLoader = async (): Promise<Token[]> => {
  const response = await fetch('/api/tokens');
  if (!response.ok) {
    throw new Error('An error occurred!');
  }
  return response.json();
};

// Interfejs stanu dla okna dialogowego usuwania tokena
interface DeleteDialogState {
  isOpen: boolean;
  tokenId: string;
}

// Will be changed in next PR
/**
 * Table component that displays a list of tokens with their ID and validity.
 * Token IDs are clickable links that navigate to the token details page.
 *
 * @param tokens - Array of tokens to display
 */
function TokenTable({ tokens }: { tokens: Token[] }) {
  const theaders = ['ID', 'Service From', 'Service To', 'Expires at', 'Actions'];

  // Zmodyfikowany stan dla okna dialogowego
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isOpen: false,
    tokenId: '',
  });

  const auth = useAuth('admin');

  // Funkcja obsługująca potwierdzenie usunięcia
  const handleConfirmDelete = async () => {
    if (auth) {
      console.log('Token Deleted');
    }
    setDeleteDialog({ isOpen: false, tokenId: '' });
  };

  const handleCloseDialog = () => {
    setDeleteDialog({ isOpen: false, tokenId: '' });
  };

  return (
    <>
      <table className={'table'}>
        <thead>
          <tr>
            {theaders.map((content, index) => <th key={index}>{content}</th>)}
          </tr>
        </thead>
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
                  setActionDeleteWindow={setDeleteDialog}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={deleteDialog.isOpen}
        onClose={handleCloseDialog}
        aria-labelledby="delete-token-dialog-title"
        aria-describedby="delete-token-dialog-description"
      >
        <DialogTitle id="delete-token-dialog-title">
          Confirm Token Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-token-dialog-description">
            Are you sure you want to delete token with ID: {deleteDialog.tokenId}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * Tokens overview page component with tabbed interface.
 * Displays a list of tokens and provides a placeholder for token creation.
 *
 * @param loaderData - Array of tokens loaded by the client loader
 */
export default function Overview({ loaderData: tokens }: Route.ComponentProps) {

  const { setHeaderContent } = useSetHeader();
  setHeaderContent('Tokens');

  return (  
    <div className="grid-1-2">
        <Box>
          <TokenTable tokens={tokens} /> 
        </Box>
        <Box>
          <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Create Token</h2>
            <p>Form to create a new token will go here.</p>
          </div>
        </Box>
    </div>
  )
}
