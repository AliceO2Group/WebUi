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

import { type PropsWithChildren } from 'react';

import { type ButtonInterface } from './window.d';
import { IconContainer, IconX } from '~/ui/icon';

export const WindowTitle = ({ children }: PropsWithChildren) =>
  <h4>
    {children}
  </h4>;

export const WindowContent = ({ children }: PropsWithChildren) =>
  <span>
    {children}
  </span>;

const WindowButton = ({ children, action, className }: ButtonInterface) =>
  <button onClick={action} className={`btn ${className}`}>
    {children}
  </button>;

export const WindowButtonCancel = ({ action }: ButtonInterface) =>
  <WindowButton action={action}>
    Cancel
  </WindowButton>;

export const WindowButtonAccept = ({ action, className }: ButtonInterface) =>
  <WindowButton action={action} className={className}>
    Accept
  </WindowButton>;

export const WindowCloseIcon = ({ action, className }: ButtonInterface) =>
  <div onClick={action} className={`actionable-icon bg-transparent no-border ${className}`}>
    <IconContainer>
      <IconX/>
    </IconContainer>
  </div>;
