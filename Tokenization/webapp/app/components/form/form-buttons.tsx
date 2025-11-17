import type { ButtonInterface } from "../window/window"

const FormButton = ({type, action, className, children}: ButtonInterface) => {
    const onClick =(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        action?.();
    }
    
    return <button
        type={type}
        className={`btn ${className}`}
        onClick={onClick}
        >
        {children}
    </button>
}

export const SubmitButton = ({action, className}: ButtonInterface) => {
    return <FormButton 
        className={`btn-primary ${className}`}
        type='submit'
        action={action}
    >
        Submit
    </FormButton>
}

export const ResetButton = ({action, className}: ButtonInterface) => {
    return <FormButton 
        className={`btn-danger ${className}`}
        type='button'
        action={action}
        >
        Reset
        </FormButton>
}