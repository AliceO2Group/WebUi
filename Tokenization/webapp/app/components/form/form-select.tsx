import React, { useState, useRef, useEffect, type SetStateAction } from 'react';
import { type OptionType as Option } from '~/utils/types';

interface SelectInterface<T extends string | number = string> {
  id: string;
  options: Option[];
  placeholder?: string;
  label: string | null;
  value: T;
  setValue: React.Dispatch<SetStateAction<T>>;
}

export function FormSelect<T extends string | number = string>({
  id,
  options = [],
  placeholder = 'Wybierz...',
  label,
  value,
  setValue,
}: SelectInterface<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) || null;
  const visibleOptions = options.filter((o) => o.value !== value);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (val: T) => {
    setValue(val);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter') setOpen((prev) => !prev);
  };

  return (
    <div ref={rootRef} id={id} className="custom-select">
      {label && <label htmlFor={id} className="custom-select__label">{label}</label>}

      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="custom-select__trigger"
      >
        <span className="custom-select__value">
          {selected ? selected.label : <span className="custom-select__placeholder">{placeholder}</span>}
        </span>
        <span className="custom-select__arrow">{open ? '▴' : '▾'}</span>
      </div>

      {open && (
        <ul className="custom-select__list" role="listbox">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((opt) => (
              <li
                key={opt.value}
                role="option"
                tabIndex={0}
                className="custom-select__option"
                onClick={() => handleSelect(opt.value as T)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(opt.value as T)}
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="custom-select__empty">Brak innych opcji</li>
          )}
        </ul>
      )}
    </div>
  );
}