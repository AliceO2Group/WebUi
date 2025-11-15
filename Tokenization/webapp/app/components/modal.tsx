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
import { IconContainer, IconX } from '~/ui/icon';

interface ModalInterface extends PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onOpen?: () => void;
  onClose?: () => void;
  timeout?: number | null;
}

interface ButtonInterface extends PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {
  action?: () => void;
}

export const ModalTitle = ({ children }: PropsWithChildren) => <h4>
  {children}
</h4>;

export const ModalContent = ({ children }: PropsWithChildren) => <span>
  {children}
</span>;

export const ModalButton = ({ children, action, className }: ButtonInterface) => <button onClick={action} className={`btn ${className}`}>
  {children}
</button>;

export const ModalButtonCancel = ({ action }: ButtonInterface) => <ModalButton action={action}>
  Cancel
</ModalButton>;

export const ModalButtonAccept = ({ action, className }: ButtonInterface) => <ModalButton action={action} className={className}>
  Accept
</ModalButton>;

export const Modal = ({ children, open, setOpen, onClose, className, timeout = null }: ModalInterface) => {
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

  const arrChildren = React.Children.toArray(children);

  const checkIsComponent = (c: React.ReactNode, otype: React.ElementType): boolean => React.isValidElement(c) && c.type === otype;

  const title = arrChildren.find(
    (child) => checkIsComponent(child, ModalTitle),
  );
  const content = arrChildren.find(
    (child) => checkIsComponent(child, ModalContent),
  );
  let buttonCancel = arrChildren.find(
    (child) => checkIsComponent(child, ModalButtonCancel),
  );
  let buttonAccept = arrChildren.find(
    (child) => checkIsComponent(child, ModalButtonAccept),
  );

  const cancelAction = () => {
    setOpen(false);
    onClose?.();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const _acceptAction = React.isValidElement(buttonAccept) ?
    (buttonAccept.props as ButtonInterface).action :
    undefined;

  const acceptAction = () => {
    _acceptAction?.();
    cancelAction();
  };

  buttonCancel = React.isValidElement(buttonCancel) ?
    React.cloneElement(buttonCancel as React.ReactElement<ButtonInterface>, { action: cancelAction }) :
    <></>;

  buttonAccept = React.isValidElement(buttonAccept) ?
    React.cloneElement(buttonAccept as React.ReactElement<ButtonInterface>, { action: acceptAction }) :
    <></>;

  const visibility = open ?
    'd-block' :
    'd-none';

  return (
    <div className={`modal-overlay shadow-level1 ${visibility}`}>
      <div className={`modal level2 br2 ${className}`}>
        <div className="flex-row justify-between pv2 ph3 brb2">
          {title ?? ''}
          <button onClick={cancelAction} className="actionable-icon bg-transparent no-border">
            <IconContainer >
              <IconX/>
            </IconContainer>
          </button>

        </div>
        <div className="p3">
          <div className="mb2">
            {content ?? ''}
          </div>
          <div className="flex-row justify-end g2">
            {buttonCancel ?? ''}
            {buttonAccept ?? ''}
          </div>
        </div>
      </div>
    </div>
  );
};
