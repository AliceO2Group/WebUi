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

import  {importSPKI, CompactEncrypt } from 'jose';


/** 
 * @description Encrypts data using a provided public key with RSA-OAEP-256 and A256GCM.
 * @param publicKey - The public key in PEM format used for encryption.
 * @param data - The plaintext data to be encrypted.
 * @returns A promise that resolves to the encrypted data in JWE compact serialization format.
 * @throws Will throw an error if the encryption process fails.
 */
async function encryptWithPublicKey(publicKey: string, data: string): Promise<string> {
  const pubKey = await importSPKI(publicKey, 'RSA-OAEP-256');
  const encoder = new TextEncoder();
  const encrypted = await new CompactEncrypt(encoder.encode(data))
    .setProtectedHeader({ alg:'RSA-OAEP-256', enc:'A256GCM', typ:'JWE'  })
    .encrypt(pubKey);
  return encrypted;
}

export { encryptWithPublicKey };