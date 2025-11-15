import React, { type PropsWithChildren } from 'react'
import { type WindowInterface } from "../window/window.d";

import { type ButtonInterface, type WindowElementsWithAction } from "../window/window.d";
import { WindowTitle, WindowContent, WindowButtonAccept, WindowButtonCancel, WindowCloseIcon } from '../window/window-objects';

function getWindowChildrenAndActions({children}: PropsWithChildren) {
    const arrChildren = React.Children.toArray(children);
    const checkIsComponent = (c: React.ReactNode, otype: React.ElementType): boolean => React.isValidElement(c) && c.type === otype;
  
    const title = arrChildren.find(
      (child) => checkIsComponent(child,WindowTitle),
    );
    const content = arrChildren.find(
      (child) => checkIsComponent(child,WindowContent),
    );
    const buttonCancel = arrChildren.find(
      (child) => checkIsComponent(child, WindowButtonCancel),
    );
    const buttonAccept = arrChildren.find(
      (child) => checkIsComponent(child, WindowButtonAccept),
    );
    const closeIcon = arrChildren.find(
      (child) => checkIsComponent(child, WindowCloseIcon)
    )

    const acceptAction = React.isValidElement(buttonAccept) ?
    (buttonAccept.props as ButtonInterface).action :
    undefined;
  
    return {title, content, buttonCancel, buttonAccept, closeIcon, acceptAction} as WindowElementsWithAction
}

function providePropsForWindowChildren({closeIcon, buttonCancel, buttonAccept, cancelAction, acceptAction}: WindowElementsWithAction) {      
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
        closeIcon: _closeIcon
    }

      
}

function useWindowLogic({open, setOpen, onClose, timeout = null }: WindowInterface) {
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

  return {cancelAction}
}

export function useFullWindowLogic({ children, open, setOpen, onClose, timeout = null }: WindowInterface) {
  const {cancelAction} = useWindowLogic({open, setOpen, onClose, timeout});
  let winElemsAndActions: WindowElementsWithAction = getWindowChildrenAndActions({children})
  const {closeIcon, buttonAccept, buttonCancel} = providePropsForWindowChildren({...winElemsAndActions, cancelAction})
  const {title, content} = winElemsAndActions

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
      buttonCancel
    }
  }
}