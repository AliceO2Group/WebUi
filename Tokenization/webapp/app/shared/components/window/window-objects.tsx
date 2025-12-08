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

/**
 * WindowTitle
 *
 * Small presentational component used as a child of Modal/Alert to mark the title region.
 *
 * @param {object} props - component props
 * @param {React.ReactNode} props.children - title content
 */
export const WindowTitle = ({ children }: PropsWithChildren) =>
  <h4>
    {children}
  </h4>;

/**
 * WindowContent
 *
 * Presentational wrapper for main window content.
 *
 * @param {object} props - component props
 * @param {React.ReactNode} props.children - content to display inside the window body
 */
export const WindowContent = ({ children }: PropsWithChildren) =>
  <span>
    {children}
  </span>;

/**
 * WindowButton / WindowButtonCancel / WindowButtonAccept
 *
 * Reusable button components used inside Window children.
 *
 * @param {object} props - component props
 * @param {React.ReactNode} props.children - button label/content
 * @param {() => void} [props.action] - callback invoked on click (wrapped by parent logic when cloned)
 * @param {string} [props.className] - additional CSS classes
 *
 * Notes:
 * - Parent window logic (useFullWindowLogic) clones these elements and injects action handlers.
 */
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

/**
 * WindowCloseIcon
 *
 * Clickable close icon used in window chrome.
 *
 * @param {object} props - component props
 * @param {() => void} [props.action] - click handler (parent will inject cancel/close action)
 * @param {string} [props.className] - additional CSS classes
 */
export const WindowCloseIcon = ({ action, className }: ButtonInterface) =>
  <div onClick={action} className={`actionable-icon bg-transparent no-border ${className}`}>
    <IconContainer>
      <IconX/>
    </IconContainer>
  </div>;
