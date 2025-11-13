import React from "react";
import {Link} from "react-router"
import { IconArrowCircleRight, IconContainer } from "~/ui/icon";

interface BoxInterface{
    children: React.ReactNode;
    link: string
}

interface PrimaryBoxInterface extends BoxInterface {
    className_div1: string,
    className_div2: string
}

export const Box = ({children, link, className_div1, className_div2}: PrimaryBoxInterface) => {
    return (
    <div className={`bg-gray m3 ${className_div1}`}>
        <div className={`flex-row justify-center ${className_div2}`}>
            <div className="w-90">
                <Link to={link}>
                    <IconContainer className="scale15">
                        <IconArrowCircleRight />
                    </IconContainer>
                </Link>
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

export const Box1_2 = ({children, link}: BoxInterface) => {
    return (
    <Box 
        link={link} 
        className_div1="min-height-box-1" 
        className_div2="mv3"
    >
        {children}
    </Box>
    )
}