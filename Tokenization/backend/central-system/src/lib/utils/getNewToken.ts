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

import { CentralSystemWrapper } from "../../wrapper/CentralSystemWrapper.js";
import { emitAndWait } from "../event-bus/rpc.js";
import { EventType } from "../utils/events.js";
import { buildTransitInput } from "./bs64Encode.js";
import { encryptWithPublicKey } from "./encrypt.js";
import { DuplexMessageEvent } from "../../wrapper/models/message.model.js";

import { SingleTokenPayload } from "../../wrapper/models/token.model.js";
import { TokenMessage } from "../../services/models/message.model.js";

export async function getNewToken(
  clientSerialNumber: string,
  targetAddress: string,
  centralSystemWrapper: CentralSystemWrapper
): Promise<void> {
  const policicies = (
    await emitAndWait<{ path: string }, any>(EventType.GET_CREDENTIAL_VAULT, {
      path: `${clientSerialNumber}/policicies`,
    })
  ).policies;
  const receiverAdress = (
    await emitAndWait<{ path: string }, any>(EventType.GET_CREDENTIAL_VAULT, {
      path: `${targetAddress}/serialNumber`,
    })
  ).serialNumber;
  const publicKey = (
    await emitAndWait<{ path: string }, any>(EventType.GET_CREDENTIAL_VAULT, {
      path: `${receiverAdress}/publicKey`,
    })
  ).publicKey;
  const centralSystremSerialNumber = process.env
    .CENTRAL_SYSTEM_SERIAL_NUMBER as string;

  const iat: Record<string, number> = {};
  const exp: Record<string, number> = {};

  for (const [policy, time] of Object.entries(policicies)) {
    iat[policy] = Date.now();
    exp[policy] = Date.now() + (time as number);
  }
  const header = { alg: "EdDSA", typ: "JWT", kid: "jwt-signer:v1" };
  const payload = {
    sub: clientSerialNumber,
    aud: receiverAdress,
    iss: centralSystremSerialNumber,
    iat,
    exp,
    jti: crypto.randomUUID,
  };

  const { input, signingInput } = buildTransitInput(header, payload);

  const signB64 = await emitAndWait<{ data: string }, string>(
    EventType.SIGN_TOKEN_VAULT,
    { data: input }
  );

  const sign64Bu = Buffer.from(signB64, "base64").toString("base64url");
  const jws = `${signingInput}.${sign64Bu}`;
  const jwe = await encryptWithPublicKey(publicKey, jws);

  centralSystemWrapper.sendEvent(clientSerialNumber, {
    event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
    payload: {
      singleToken: { token: jwe } as TokenMessage,
    } as SingleTokenPayload,
  });
}
