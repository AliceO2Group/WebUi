import React from "react";

import { checkIsComponentOfType } from "~/utils/component-type-checker";
/**
 * React component that wraps all children in a flex-grow div.
 * 
 * @param props.children - React nodes to be wrapped
 * @param props.className - additional class names to add to the wrapper div
 * @returns 
 */
export function FlexGrowWrapperElement({children, className}: {children: React.ReactNode, className?: string}) { 
    return <div className={`flex-grow ${className ?? ''}`}>{children}</div>
}

/**
 * React component that Wraps all children in a flex-grow div inside a flex-row container. 
 * If element is already a FlexGrowWrapperElement, it is not wrapped again.
 * 
 * @param props.children - React nodes to be wrapped
 */
export function FlexGrowWrapper({children}: {children: React.ReactNode}) {
    let wrappedChildren;
    if(children) {
        const arrayChildren = React.Children.toArray(children);
        wrappedChildren = arrayChildren.map((child: React.ReactNode, index: number) => (
            checkIsComponentOfType(child, FlexGrowWrapperElement)) ?
            <React.Fragment key={index}>{child}</React.Fragment> :
            <div className="flex-grow" key={index}>{child}</div>
        );
    } else {
        wrappedChildren = children;
    }
    
    return <div className="flex-row g2">{wrappedChildren}</div>
}

