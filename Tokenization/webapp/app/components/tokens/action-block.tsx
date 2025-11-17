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
import { IconDelete } from '~/ui/icon';

interface DeleteDialogState {
  isOpen: boolean;
  tokenId: string;
}

interface ActionBlockProps {
  tokenId: string;
  setActionDeleteWindow: React.Dispatch<React.SetStateAction<DeleteDialogState>>;
}

/**
 * Action block component that provides token actions such as delete
 */
export default function ActionBlock({ tokenId, setActionDeleteWindow }: ActionBlockProps) {
  const handleDelete = () => {
    setActionDeleteWindow({
      isOpen: true,
      tokenId: tokenId,
    });
  };

  return (
    <div>
      <button
        className="bg-danger btn-sm"
        onClick={handleDelete}
        aria-label={`Delete token ${tokenId}`}
        title="Delete token"
      >
        <IconDelete />
      </button>
    </div>
  );
}
