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
  onClick: () => void;
  title?: string;
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
export function ActionBlockBase({ onClick, title }: ActionBlockProps) {
  return (
    <div>
      <button
        className="bg-danger btn-sm static"
        onClick={onClick}
        title={title}
      >
        <IconDelete />
      </button>
    </div>
  );
}

export function ActionBlockBulk({ onClick }: ActionBlockProps) {
  return (<ActionBlockBase onClick={onClick} title="Revoke tokens selected by filter" />);
}

export function ActionBlockSolo({ onClick }: ActionBlockProps) {
  return (<ActionBlockBase onClick={onClick} title="Revoke token" />);
}