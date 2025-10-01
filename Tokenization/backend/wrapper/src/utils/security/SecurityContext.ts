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

/**
 * @description Stores every keys and certificates needed for gRPC mTLS communication and token verifications (JWE/JWS)
 */
export class SecurityContext {
  // mTLS keys (RSA)
  public readonly caCert: Buffer;
  public readonly clientSenderCert: Buffer;
  public readonly clientListenerCert?: Buffer;
  public readonly clientPublicKey: Buffer;
  // RSA Private Key (PKCS8) for JWE decryption
  public readonly clientPrivateKey: Buffer;

  // Public Ed25519 key for JWS verification
  public readonly JWS_PUBLIC_KEY =
    "hTb3l5gwoIWISOLi6cQMwcultawKyA6vxnimXWtE6JI=";

  constructor(
    caCert: Buffer,
    clientSenderCert: Buffer,
    clientPrivateKey: Buffer,
    clientPublicKey: Buffer,
    clientListenerCert?: Buffer
  ) {
    this.caCert = caCert;
    this.clientSenderCert = clientSenderCert;
    this.clientPrivateKey = clientPrivateKey;
    this.clientPublicKey = clientPublicKey;

    if (clientListenerCert) {
      this.clientListenerCert = clientListenerCert;
    }
  }
}
