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

import { WindowTitle, WindowContent } from '~/shared/components/window/window-objects';

/**
 *
 */
export default function ConfirmModalContent({
  firstLabel,
  secondLabel,
  expirationTime,
  methods,
}: {
  firstLabel: string;
  secondLabel: string;
  expirationTime: string;
  methods: string[];
}) {
  return <>
    <WindowTitle>Confirm Token Creation</WindowTitle>
    <WindowContent>
      <div className="flex-column align-center justify-center">
        <div className="mb2">Are you sure you want to create the token with the specified settings?</div>
        <div>Service from: {firstLabel}</div>
        <div>Service to: {secondLabel}</div>
        <div>Expiration time: {expirationTime} hours</div>
        <div>HTTP methods: {methods.join(', ')}</div>
      </div>
    </WindowContent>
  </>;
}
