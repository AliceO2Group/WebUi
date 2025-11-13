import React, { type PropsWithChildren, } from 'react'
import { IconContainer, IconX } from '~/ui/icon';

interface ModalInterface extends PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onOpen?: () => void
    onClose?: () => void;
    timeout?: number | null;
}

interface ButtonInterface extends PropsWithChildren, React.HTMLAttributes<HTMLDivElement> {
    action?: () => void
}

export const ModalTitle = ({children}: PropsWithChildren) => {
    return <h4>
        {children}
    </h4>
}

export const ModalContent = ({children}: PropsWithChildren) => {
    return <span>
        {children}
    </span>
}

export const ModalButton = ({children, action, className}: ButtonInterface) => {
    return <button onClick={action} className={`btn ${className}`}>
            {children}
        </button>
}

export const ModalButtonCancel = ({action}: ButtonInterface) => {
    return <ModalButton action={action}>
        Cancel
    </ModalButton>
}

export const ModalButtonAccept = ({action, className}: ButtonInterface) => {
    return <ModalButton action={action} className={className}>
        Accept
    </ModalButton>
}

export const Modal = ({children, open, setOpen, onClose, className, timeout = null}: ModalInterface) => {
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    
    // timeout 
    React.useEffect(() => {
        if(open && timeout) {
            if(timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(() => {
                setOpen(false);
                onClose && onClose();
            }, timeout);
        }

        // unmounting timer
        return () => {
            if(timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null;
            }
        }
    }, [open, timeout, setOpen, onClose])
    
    const arrChildren = React.Children.toArray(children)

    const checkIsComponent = (c: React.ReactNode, otype: React.ElementType): boolean => {
        return React.isValidElement(c) && c.type === otype
    }

    const title = arrChildren.find(
        (child) => checkIsComponent(child, ModalTitle)
    );
    const content = arrChildren.find(
        (child) => checkIsComponent(child, ModalContent)
    );
    let buttonCancel = arrChildren.find(
        (child) => checkIsComponent(child, ModalButtonCancel)
    );
    let buttonAccept = arrChildren.find(
        (child) => checkIsComponent(child, ModalButtonAccept)
    );

    const cancelAction = () => {
        setOpen(false)
        onClose && onClose();
        if(timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null;
        }
    }

    const _acceptAction = React.isValidElement(buttonAccept) ?
        (buttonAccept.props as ButtonInterface).action :
        undefined

    const acceptAction = () => {
        _acceptAction && _acceptAction();
        cancelAction()
    }

    buttonCancel = React.isValidElement(buttonCancel) ? 
        React.cloneElement(buttonCancel as React.ReactElement<ButtonInterface>, {action: cancelAction}):
        <></>

    buttonAccept = React.isValidElement(buttonAccept) ? 
        React.cloneElement(buttonAccept as React.ReactElement<ButtonInterface>, {action: acceptAction}):
        <></>

    const visibility = open ? 
        "d-block":
        "d-none";

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
    )
}