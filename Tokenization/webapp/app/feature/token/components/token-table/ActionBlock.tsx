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

import type { PropsWithChildren } from 'react';
import { IconDelete, IconLockUnlocked } from '~/ui/icon';

interface ActionBlockProps {
  onClick: () => void;
  title?: string;
  className?: string;
  disabled?: boolean
}

/**
 * ActionBlock
 *
 * Small UI block that renders action button with specified click handler and title.
 *
 * @param {object} props - component props
 * @param {() => void} props.onClick - click handler invoked when the action button is pressed
 * @param {string} props.title - optional title for the action button
 */
export function ActionBlockBase({ onClick,
  title,
  children,
  className,
  disabled
}: PropsWithChildren<ActionBlockProps>) {
  return (
    <div>
      <button
        className={`btn-sm static ${className ?? ''}`}
        onClick={onClick}
        title={title}
        disabled={disabled}
      >
        {children}
      </button>
    </div>
  );
}

/**
 *  BanBlockBulk
 *
 *  UI block that renders action button for bulk token revocation.
 *
 *  @param {object} props - component props
 *  @param {() => void} props.onClick - click handler invoked when the action button is pressed
 */
export function BanBlockBulk({ onClick, disabled }: ActionBlockProps) {
  return (<ActionBlockBase 
    onClick={onClick} 
    title="Revoke tokens selected by filter"
    className='bg-danger'
    disabled={disabled}
    >
    <IconDelete />
  </ActionBlockBase>);
}

/**
 * BanBlockSolo
 *
 * @param {object} props - component props
 * @param {() => void} props.onClick - click handler invoked when the action button is pressed
 */
export function BanBlockSolo({ onClick }: ActionBlockProps) {
  return (<ActionBlockBase 
    onClick={onClick} 
    title="Revoke token" 
    className='bg-danger'
    disabled={false}
    >
    <IconDelete />
  </ActionBlockBase>);
}

export function UnbanBlockBulk({ onClick, disabled }: ActionBlockProps) {
  return (<ActionBlockBase 
    onClick={onClick} 
    title="Unban tokens selected by filter"
    className='bg-success'
    disabled={disabled}
    >
    <IconLockUnlocked />
  </ActionBlockBase>);
}


export function UnbanBlockSolo({ onClick }: ActionBlockProps) {
  return (<ActionBlockBase 
    onClick={onClick} 
    title="Unban token" 
    className='bg-success'
    disabled={false}
    >
    <IconLockUnlocked />
  </ActionBlockBase>);
}



