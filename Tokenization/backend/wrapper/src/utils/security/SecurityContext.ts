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
  // Keys for mTLS (RSA)
  public readonly caCert: Buffer;
  public readonly clientSenderCert: Buffer;
  public readonly clientListenerCert?: Buffer;
  public readonly clientPublicKey: Buffer;
  // RSA Private Key (PKCS8) for JWE decryption
  public readonly clientPrivateKey: Buffer;

  // Public Ed25519 key for JWS verification
  public readonly JWS_PUBLIC_KEY: string;

  /**
   * Initializes an instance of SecurityContext class.
   *
   * @param caCert - The root Certificate Authority (CA) certificate used for mTLS.
   * @param clientSenderCert - The client certificate used for mTLS.
   * @param clientPrivateKey - The client private key (PKCS8) used for JWE decryption.
   * @param clientPublicKey - The client public key used for JWE encryption.
   * @param clientListenerCert - The client listener certificate (optional) used for mTLS.
   * @param JWS_PUBLIC_KEY - The public Ed25519 key used for JWS verification (optional, default value is provided if not set).
   */
  constructor(
    caCert: Buffer,
    clientSenderCert: Buffer,
    clientPrivateKey: Buffer,
    clientPublicKey: Buffer,
    clientListenerCert?: Buffer,
    JWS_PUBLIC_KEY?: string
  ) {
    this.caCert = caCert;
    this.clientSenderCert = clientSenderCert;
    this.clientPrivateKey = clientPrivateKey;
    this.clientPublicKey = clientPublicKey;

    if (clientListenerCert) {
      this.clientListenerCert = clientListenerCert;
    }

    if (JWS_PUBLIC_KEY) {
      this.JWS_PUBLIC_KEY = JWS_PUBLIC_KEY;
    } else {
      this.JWS_PUBLIC_KEY = 'hTb3l5gwoIWISOLi6cQMwcultawKyA6vxnimXWtE6JI=';
    }
  }
}
