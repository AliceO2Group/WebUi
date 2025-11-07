import React from "react";
import { IconArrowCircleRight, IconContainer } from "~/ui/icon";

export const Box = ({children}: {children: React.ReactNode}) => {
    return (
    <div className="bg-gray m3 min-height-box-1">
        <div className="flex-row justify-center mv3">
            <div className="w-90">
                <IconContainer className="scale15">
                    <IconArrowCircleRight />
                </IconContainer>
            </div>
        </div>
        <div className="flex-row justify-center">
            <div className="w-95">
            {children}
            </div>
        </div>
    </div>
    )
}