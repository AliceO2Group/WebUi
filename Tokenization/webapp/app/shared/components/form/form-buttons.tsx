/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import type { ButtonInterface } from '../window/window';

/**
 * Generic form button wrapper.
 *
 * Renders a <button> element and wraps the provided action callback with
 * preventDefault behaviour. The provided `action` will be invoked after
 * preventDefault has been called on the click event.
 *
 * @param {object} props - Component props.
 * @param {('button'|'submit'|'reset')} props.type - Button type attribute.
 * @param {() => void} [props.action] - Callback to run on click; FormButton calls event.preventDefault() before invoking it.
 * @param {string} [props.className] - Additional CSS classes.
 * Prefer using this to change button color (e.g. "btn-primary" or "btn-danger"),
 * but it can also be used for sizing, spacing or other style tweaks.
 * @param {React.ReactNode} [props.children] - Button content.
 */
function FormButton({ type, action, className, children }: ButtonInterface) {

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    action?.();
  };

  return (
    <button
      type={type}
      className={`btn ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * Submit button with primary styling.
 *
 * @param {object} props - Component props.
 * @param {() => void} [props.action] - Click handler; will be wrapped with preventDefault() behaviour.
 * @param {string} [props.className] - Additional classes to modify appearance (recommended for color changes).
 */
export function SubmitButton({ action, className }: ButtonInterface) {
  return (
    <FormButton
      className={`btn-primary ${className}`}
      type='submit'
      action={action}
    >
      Submit
    </FormButton>
  );
}

/**
 * Reset button with danger styling.
 *
 * @param {object} props - Component props.
 * @param {() => void} [props.action] - Click handler; will be wrapped with preventDefault() behaviour.
 * @param {string} [props.className] - Additional classes to modify appearance (recommended for color changes).
 */
export function ResetButton({ action, className }: ButtonInterface) {
  return (
    <FormButton
      className={`btn-danger ${className}`}
      type='button'
      action={action}
    >
      Reset
    </FormButton>
  );
}
