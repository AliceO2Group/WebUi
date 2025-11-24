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

import { IconDelete } from '~/ui/icon';

interface ActionBlockProps {
  tokenId: string;
  onClick: () => void;
}

/**
 * ActionBlock
 *
 * Small UI block that renders action controls for a token (currently a delete button).
 *
 * @param {object} props - component props
 * @param {string} props.tokenId - id of the token the actions operate on (used for aria/title)
 * @param {() => void} props.onClick - click handler invoked when the action button is pressed
 */
export default function ActionBlock({ tokenId, onClick }: ActionBlockProps) {
  return (
    <div>
      <button
        className="bg-danger btn-sm"
        onClick={onClick}
        aria-label={`Delete token ${tokenId}`}
        title="Delete token"
      >
        <IconDelete />
      </button>
    </div>
  );
}
