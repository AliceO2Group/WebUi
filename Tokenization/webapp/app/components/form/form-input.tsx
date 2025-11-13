import React from "react";

export interface FormInputProps<T extends string | number = string> {
  value: T;
  setValue: React.Dispatch<React.SetStateAction<T>>;
  labelText?: string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FormInput = <T extends string | number = string>({
  value,
  setValue,
  labelText,
  containerProps,
  labelProps,
  inputProps,
}: FormInputProps<T>) => {
  const inputId = inputProps?.id ?? labelProps?.htmlFor ?? undefined;
  const type = typeof value === 'string' ? 'text' : 'number'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    let newVal: T;
    if(typeof value === "number") {
        const parsed = parseFloat(target.value)
        newVal = (isNaN(parsed) ? 0 : parsed) as T;
    }else {
        newVal = target.value as T;
    } 
    setValue(newVal);
  };


  return (
    <div {...containerProps}>
      {labelText && (
        <label {...labelProps} htmlFor={inputId}>
          {labelText}
        </label>
      )}
      <input
        {...inputProps}
        id={inputId}
        type={type}
        value={value as unknown as string}
        onChange={handleChange}
      />
    </div>
  );
};
