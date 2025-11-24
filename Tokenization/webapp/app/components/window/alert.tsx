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
import { useFullWindowLogic } from '../hooks/useWindowLogic';

/**
 * Alert
 *
 * Small transient alert window.
 *
 * @param {object} props - component props (see WindowInterface in window.d.ts)
 * @param {React.ReactNode} props.children - alert content (typically WindowTitle + WindowContent + optional WindowCloseIcon)
 * @param {boolean} props.open - whether the modal is visible (provided via DPB)
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpen - dispatcher to control visibility (provided via DPB)
 * @param {() => void} [props.onClose] - optional callback invoked when alert closes
 * @param {number|null} [props.timeout] - optional auto-close timeout in milliseconds (useful for transient alerts)
 * @param {string} [props.className] - additional CSS classes applied to the modal container
 * (expected to be used to control bg-color, but can be more versatile)
 * Behaviour:
 * - Delegates lifecycle (timeout, close action) and child wiring to useFullWindowLogic(props).
 * - Renders title, content and closeIcon produced by the hook.
 */
const Alert = (props: WindowInterface) => {

  const { className } = props;
  const { visibility, ui_elements: { title, content, closeIcon } } = useFullWindowLogic(props);

  return (
    <div className={`alert level1 br2 ${visibility} ${className}`}>
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
