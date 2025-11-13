import React from "react"

interface FormInterface extends React.HTMLAttributes<HTMLFormElement> {}


export const Form = ({children, className, onSubmit, id}: FormInterface) => {    
    const _className = className ?? ''
    return (
        <div 
            id={id} 
            className={_className}
        >
            <form onSubmit={onSubmit}>
                {children}
            </form>
        </div>
    )
}