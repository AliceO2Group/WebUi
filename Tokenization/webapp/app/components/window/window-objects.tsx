import { type PropsWithChildren } from "react";

import { type ButtonInterface } from "./window.d";
import { IconContainer, IconX } from "~/ui/icon";

export const WindowTitle = ({ children }: PropsWithChildren) => <h4>
  {children}
</h4>;

export const WindowContent = ({ children }: PropsWithChildren) => <span>
  {children}
</span>;

const WindowButton = ({ children, action, className }: ButtonInterface) => <button onClick={action} className={`btn ${className}`}>
  {children}
</button>;

export const WindowButtonCancel = ({ action }: ButtonInterface) => <WindowButton action={action}>
  Cancel
</WindowButton>;

export const WindowButtonAccept = ({ action, className }: ButtonInterface) => <WindowButton action={action} className={className}>
  Accept
</WindowButton>;

export const WindowCloseIcon =({action, className}: ButtonInterface) => <div onClick={action} className={`actionable-icon bg-transparent no-border ${className}`}>
    <IconContainer>
        <IconX/>
    </IconContainer>
</div>

