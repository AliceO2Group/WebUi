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

export default (props: WindowInterface) => {
  const {className} = props;
  const {visibility, ui_elements: {title, content, closeIcon, buttonCancel, buttonAccept }} = useFullWindowLogic(props);

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
