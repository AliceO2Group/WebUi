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

import { TokenListPayload } from "../../wrapper/models/token.model";
import { CentralSystemWrapper } from "../../wrapper/CentralSystemWrapper";
import { DuplexMessageEvent } from "../../wrapper/models/message.model";

/**
 * @description Helper function to get all tokens for a client and send them via the central system wrapper.
 */
export async function getTokensHelper(
  clientSerialNumber: string,
  centralSystemWrapper: CentralSystemWrapper
): Promise<void> {
  //database call needed
  //   centralSystemWrapper.sendEvent(clientSerialNumber, {
  //     event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
  //     payload: { tokens: ... as TokenListPayload },
  //   });
}
