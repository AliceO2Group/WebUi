import React, { useEffect, useRef, useState, type SetStateAction, type JSX, type PropsWithChildren } from 'react';
import { type OptionType as Option, type DialogPropsBase as DPB } from '~/utils/types';

interface SelectInterface<T = string | number | (string | number)[]> {
  id: string;
  options: Option[];
  placeholder?: string;
  label: string | null;
  value: T;
  setValue: React.Dispatch<SetStateAction<T>>;
}

interface SelectLabelProps extends DPB {
  selected: Option | Option[] | null;
  placeholder: string;
}

interface SelectOptionsProps<T> extends DPB {
  options: Option[];
  handleSelect?: (value: T) => void;
}

const SelectFrame = ({open, setOpen, selected, placeholder}: SelectLabelProps) => {
  let _selected: Option | null = Array.isArray(selected) ? (selected.length > 0 ? selected[0] : null) : selected;
  
  return (<div
        onClick={() => setOpen((prev) => !prev)}
        className="flex-row border p2 justify-between br2 bg-white bra2"
      >
        <span>
          {_selected ? _selected.label : <span>{placeholder}</span>}
        </span>
        <span>{open ? '▴' : '▾'}</span>
      </div>
      )
}

const SelectFrameMulti = (props: SelectLabelProps) => {
  let {open, setOpen, selected, placeholder} = props
  let _selected: Option[] | null = Array.isArray(selected) ? selected : (selected ? [selected] : null);

  return (<div
        onClick={() => setOpen((prev) => !prev)}
        className="flex-row border p2 justify-between br2 bg-white bra2"
      >
        <span>
          {_selected && 
            _selected.length > 0 ? 
            _selected.map((s) => s.label).join(', '): 
            <span>{placeholder}</span>}
        </span>
        <span>{open ? '▴' : '▾'}</span>
      </div>
      )

}

const SelectOptions = <T,>({open, setOpen, handleSelect, options}: SelectOptionsProps<T>) => {
  const visibleOptions = options;
  const _handleSelect = (val: T) => {
    handleSelect && handleSelect(val);
    setOpen(false);
  }

  return ( 
    <>
      {open && (
            <ul className="absolute w-100 bg-white br2 decoration-none bra2 p0 level1 mv1">
              {visibleOptions.length > 0 ? (
                visibleOptions.map((opt) => (
                  <li
                    key={String(opt.value)}
                    onClick={() => _handleSelect(opt.value as T)}
                    className="f4 menu-item m0"
                  >
                    {opt.label}
                  </li>
                ))
              ) : (
                <li>No options available</li>
              )}
            </ul>
      )}
    </>
  )

}

export const FormSelect = <T extends string | number = string,>({
  id,
  options = [],
  placeholder = 'Choose an option...',
  label,
  value,
  setValue,
}: SelectInterface<T>): JSX.Element => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const onClickExpand = () => {
    setOpen((prev) => !prev);
  }

  const handleSelect = (val: T) => {
    setValue(val);
  }

  return (
    <div ref={rootRef} id={id} className="relative">
      {label && <span onClick={onClickExpand}>{label}</span>}
      <SelectFrame
        open={open} 
        setOpen={setOpen} 
        selected={selected} 
        placeholder={placeholder} 
      />
      <SelectOptions
        open={open} 
        setOpen={setOpen}
        options={options}
        handleSelect={handleSelect}
      />

    </div>
  );
}

export const FormSelectMulti = <T extends string | number = string>({
  id,
  options = [],
  placeholder = 'Choose options...',
  label,
  value,
  setValue,
}: SelectInterface<T[]>): JSX.Element => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.filter((o) => value.includes(o.value as unknown as T)) || [];

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const onClickExpand = () => {
    setOpen((prev) => !prev);
  }

  const handleSelect = (val: T) => {
    setValue((prev) => {
        return [...prev, val];
    })
  }

  return (
    <div ref={rootRef} id={id} className="relative">
      {label && <span onClick={onClickExpand}>{label}</span>}
      <SelectFrameMulti
        open={open} 
        setOpen={setOpen} 
        selected={selected} 
        placeholder={placeholder} 
      />
      <SelectOptions
        open={open} 
        setOpen={setOpen}
        options={options}
        handleSelect={handleSelect}
      />
    </div>
  );
}


