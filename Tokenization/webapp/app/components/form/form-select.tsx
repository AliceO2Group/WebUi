import React, { type SetStateAction } from "react"
import { type OptionType as Option} from "~/utils/types"

interface SelectInterface<T extends string | number = string> {
    id: string;
    options: Option[];
    placeholder?: string;
    label: string | null;
    value: T //| T[];
    setValue: React.Dispatch<React.SetStateAction<T>>
}

export const FormSelect = <T extends string | number = string>(props: SelectInterface<T>) => {
    const {id,options, placeholder, label, value, setValue} = props;
    
    return (
        <div>
            <label htmlFor={id}>{label}</label>
            <select id={id} className="my-select">
                <option value="" disabled selected>{placeholder}</option>
                {
                    options.map((option) => (
                        option.value !== value && <option 
                            key={option.value} 
                            value={option.value}
                            selected={option.value === value}
                            onClick={() => setValue(option.value as SetStateAction<T>)}
                        >
                            {option.label}
                        </option>
                    ))
                }
            </select>
        </div>

    )
}