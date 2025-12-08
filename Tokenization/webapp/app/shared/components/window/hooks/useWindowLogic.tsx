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

import React, { type PropsWithChildren } from 'react';
import { type WindowInterface } from '../window.d';

import { type ButtonInterface, type WindowElementsWithAction } from '../window.d';
import { WindowTitle, WindowContent, WindowButtonAccept, WindowButtonCancel, WindowCloseIcon } from '../window-objects';
import { checkIsComponentOfType } from '~/utils/component-type-checker';

/**
 * GetWindowChildrenAndActions
 *
 * Non-hook helper. Scans React children and extracts known Window subcomponents
 * (WindowTitle, WindowContent, WindowButtonCancel, WindowButtonAccept, WindowCloseIcon).
 *
 * @param {object} props
 * @param {React.PropsWithChildren} props.children - children passed to the Window component
 * @returns {WindowElementsWithAction} Object with:
 *   - title: React.ReactNode | undefined  (the WindowTitle child if present)
 *   - content: React.ReactNode | undefined (the WindowContent child if present)
 *   - buttonCancel: React.ReactNode | undefined (the WindowButtonCancel child if present)
 *   - buttonAccept: React.ReactNode | undefined (the WindowButtonAccept child if present)
 *   - closeIcon: React.ReactNode | undefined (the WindowCloseIcon child if present)
 *   - acceptAction: (() => void) | undefined (action extracted from the accept button props, if any)
 *
 */
function getWindowChildrenAndActions({ children }: PropsWithChildren) {
  const arrChildren = React.Children.toArray(children);

  // Check for React.Fragment and unwrap its children
  const reactFragment = arrChildren.find(
    (child) => checkIsComponentOfType(child, React.Fragment),
  );

  if (reactFragment && React.isValidElement(reactFragment)) {
    const fragmentChildren = React.Children.toArray((reactFragment.props as PropsWithChildren).children);
    arrChildren.splice(
      arrChildren.indexOf(reactFragment),
      1,
      ...fragmentChildren,
    );
  }

  const title = arrChildren.find(
    (child) => checkIsComponentOfType(child, WindowTitle),
  );
  const content = arrChildren.find(
    (child) => checkIsComponentOfType(child, WindowContent),
  );
  const buttonCancel = arrChildren.find(
    (child) => checkIsComponentOfType(child, WindowButtonCancel),
  );
  const buttonAccept = arrChildren.find(
    (child) => checkIsComponentOfType(child, WindowButtonAccept),
  );
  const closeIcon = arrChildren.find(
    (child) => checkIsComponentOfType(child, WindowCloseIcon),
  );

  const acceptAction = React.isValidElement(buttonAccept) ?
    (buttonAccept.props as ButtonInterface).action :
    undefined;

  return { title, content, buttonCancel, buttonAccept, closeIcon, acceptAction } as WindowElementsWithAction;
}

/**
 * ProvidePropsForWindowChildren
 *
 * Non-hook helper. Clones provided button/close icon elements and injects
 * runtime action handlers (cancelAction / wrapped acceptAction).
 *
 * @param {WindowElementsWithAction} params - object containing children and actions
 * @param {React.ReactNode} params.closeIcon - close icon element (may be undefined)
 * @param {React.ReactNode} params.buttonCancel - cancel button element (may be undefined)
 * @param {React.ReactNode} params.buttonAccept - accept button element (may be undefined)
 * @param {() => void} params.cancelAction - function to call to cancel/close the window
 * @param {() => void | undefined} params.acceptAction - original accept action (optional); will be wrapped so it also triggers cancelAction
 * @returns {{buttonCancel: React.ReactNode, buttonAccept: React.ReactNode, closeIcon: React.ReactNode}}
 *
 * Behaviour:
 * - If a provided element is a valid React element, it will be cloned with an injected
 *   `action` prop bound to cancelAction or the wrapped accept action.
 * - Otherwise returns empty fragments for missing elements.
 */
function providePropsForWindowChildren({ closeIcon, buttonCancel, buttonAccept, cancelAction, acceptAction }: WindowElementsWithAction) {
  const _acceptAction = () => {
    acceptAction?.();
    cancelAction();
  };

  const _buttonCancel = React.isValidElement(buttonCancel) ?
    React.cloneElement(buttonCancel as React.ReactElement<ButtonInterface>, { action: cancelAction }) :
    <></>;

  const _closeIcon = React.isValidElement(closeIcon) ?
    React.cloneElement(closeIcon as React.ReactElement<ButtonInterface>, { action: cancelAction }) :
    <></>;

  const _buttonAccept = React.isValidElement(buttonAccept) ?
    React.cloneElement(buttonAccept as React.ReactElement<ButtonInterface>, { action: _acceptAction }) :
    <></>;

  return {
    buttonCancel: _buttonCancel,
    buttonAccept: _buttonAccept,
    closeIcon: _closeIcon,
  };

}

/**
 * UseWindowLogic
 *
 * Hook. Manages simple timing/close behaviour for window-like components.
 *
 * @param {WindowInterface} params
 * @param {boolean} params.open - whether the window is open
 * @param {(open: boolean) => void} params.setOpen - state setter (React.Dispatch) used to open/close the window
 * @param {() => void | undefined} params.onClose - optional callback invoked when window is closed
 * @param {number | null} [params.timeout=null] - optional auto-close timeout in milliseconds
 * @returns {{ cancelAction: () => void }}
 *
 * Behaviour / side-effects:
 * - When `open` is true and `timeout` is a number, starts a timer that calls setOpen(false) and onClose() after timeout.
 * - Cleans up the timer on unmount or when dependencies change.
 * - cancelAction: synchronous function that closes the window (setOpen(false)), calls onClose(), and clears the timer.
 *
 * Notes:
 * - This is a React hook (uses useEffect, useRef) and must be called following hooks rules.
 */
function useWindowLogic({ open, setOpen, onClose, timeout = null }: WindowInterface) {
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Timeout
  React.useEffect(() => {
    if (open && timeout) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setOpen(false);
        onClose?.();
      }, timeout);
    }

    // Unmounting timer
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, timeout, setOpen, onClose]);

  const cancelAction = () => {
    setOpen(false);
    onClose?.();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return { cancelAction };
}

/**
 * UseFullWindowLogic
 *
 * Hook. Combines child extraction and runtime wiring for window components.
 *
 * @param {WindowInterface} params
 * @param {React.ReactNode} params.children - children of the window component (may include WindowTitle, WindowContent, buttons, close icon)
 * @param {boolean} params.open - whether the window is open
 * @param {React.Dispatch<React.SetStateAction<boolean>>} params.setOpen - dispatcher to toggle window open state
 * @param {() => void | undefined} [params.onClose] - callback invoked when window is closed
 * @param {number | null} [params.timeout=null] - optional auto-close timeout in ms
 * @returns {{
 *   visibility: string,
 *   ui_elements: {
 *     title: React.ReactNode | undefined,
 *     content: React.ReactNode | undefined,
 *     closeIcon: React.ReactNode,
 *     buttonAccept: React.ReactNode,
 *     buttonCancel: React.ReactNode
 *   }
 * }}
 *
 * Behaviour:
 * - Calls useWindowLogic to obtain cancelAction and timer behaviour.
 * - Extracts window subcomponents and any accept action using getWindowChildrenAndActions.
 * - Produces cloned button/closeIcon nodes wired to cancelAction / wrapped accept action via providePropsForWindowChildren.
 * - Computes `visibility` string: 'd-block' when open, 'd-none' when closed.
 *
 * Notes:
 * - This is a hook and must follow React hooks rules.
 * - Return structure is intended for direct consumption by Window-like components to render content and controls.
 */
export function useFullWindowLogic({ children, open, setOpen, onClose, timeout = null }: WindowInterface) {
  const { cancelAction } = useWindowLogic({ open, setOpen, onClose, timeout });
  const winElemsAndActions: WindowElementsWithAction = getWindowChildrenAndActions({ children });
  const { closeIcon, buttonAccept, buttonCancel } = providePropsForWindowChildren({ ...winElemsAndActions, cancelAction });
  const { title, content } = winElemsAndActions;

  const visibility = open ?
    'd-block' :
    'd-none';

  return {
    visibility: visibility,
    ui_elements: {
      title,
      content,
      closeIcon,
      buttonAccept,
      buttonCancel,
    },
  };
}
