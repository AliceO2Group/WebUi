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

/**
 * Modal
 *
 * Application modal window component.
 *
 * @param {object} props - component props (see WindowInterface in window.d.ts)
 * @param {React.ReactNode} props.children - modal content (title/content/buttons expected as Window*
 * from ./window-objects.tsx children)
 * @param {boolean} props.open - whether the modal is visible (provided via DPB)
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpen - dispatcher to control visibility (provided via DPB)
 * @param {() => void} [props.onOpen] - optional callback invoked when modal opens
 * @param {() => void} [props.onClose] - optional callback invoked when modal closes
 * @param {number|null} [props.timeout] - optional auto-close timeout in milliseconds
 * @param {string} [props.className] - additional CSS classes applied to the modal container
 * (expected to be used to control bg-color, but can be more versatile)
 *
 * Behaviour:
 * - Uses useFullWindowLogic(props) to wire lifecycle (open/close/timeout) and to extract/wire Window child elements:
 *   title, content, closeIcon, buttonCancel, buttonAccept.
 * - Renders those wired elements inside a modal overlay.
 */
const Modal = (props: WindowInterface) => {
  const { className } = props;
  const { visibility, ui_elements: { title, content, closeIcon, buttonCancel, buttonAccept } } = useFullWindowLogic(props);

  return (
    <div className={`modal-overlay shadow-level1 ${visibility}`}>
      <div className={`modal level2 br2 ${className}`}>
        <div className="flex-row justify-between pv2 ph3 brb2">
          {title ?? ''}
          {closeIcon ?? ''}
        </div>
        <div className="p3">
          <div className="mb2">
            {content ?? ''}
          </div>
          <div className="flex-row justify-end g2">
            {buttonCancel ?? ''}
            {buttonAccept ?? ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
