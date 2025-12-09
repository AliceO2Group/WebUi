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

import { type WindowInterface } from './window.d';
import { useFullWindowLogic } from './hooks/useWindowLogic';

// Used to represent an alert message
export interface AlertType {
  title: string;
  message: string;
  success: boolean;
}

/**
 * Alert
 *
 * Small transient alert window.
 *
 * @param {object} props - component props (see WindowInterface in window.d.ts)
 * @param {React.ReactNode} props.children - alert content (typically WindowTitle + WindowContent + optional WindowCloseIcon)
 * @param {boolean} props.open - whether the modal is mounted (provided via DPB)
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpen - dispatcher to control mounting (provided via DPB)
 * @param {() => void} [props.onClose] - optional callback invoked when alert closes
 * @param {number|null} [props.timeout] - optional auto-close timeout in milliseconds (useful for transient alerts)
 * @param {string} [props.className] - additional CSS classes applied to the modal container
 * (expected to be used to control bg-color, but can be more versatile)
 * Behaviour:
 * - Delegates lifecycle (timeout, close action) and child wiring to useFullWindowLogic(props).
 * - In contrast to Modal, doesn't use visibility control through CSS, but simply doesn't render if !open.
 * - Thanks to that, timeout-based auto-close works more expectably.
 * - Renders title, content and closeIcon produced by the hook.
 */
const Alert = (props: WindowInterface) => {

  const { className } = props;
  const { ui_elements: { title, content, closeIcon } } = useFullWindowLogic(props);

  const { open } = props;
  if (!open) {
    return null;
  }

  return (
    <div className={`alert level1 br2 ${className}`}>
      <div className="flex-row justify-between pv2 ph3">
        {title ?? ''}
        {closeIcon ?? ''}
      </div>
      <div className="p3">
        <div className="mb2">
          {content ?? ''}
        </div>
      </div>
    </div>
  );
};

export default Alert;
