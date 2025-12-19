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

// Type definitions for Vault-related operations
export interface SignPayload {
  input: string;
}

type KvObject = Record<string, unknown>;
// Define the structure of the Vault KV read response`
export interface VaultReadResponse<
  TData extends KvObject = KvObject,
  TCustomMeta extends KvObject = KvObject
> {
  data: {
    data: TData;
    metadata: {
      created_time: string;
      custom_metadata: TCustomMeta;
      deletion_time: string;
      destroyed: boolean;
      version: number;
      [key: string]: unknown;
    };
  };
}

// Define the structure of the Vault KV metadata response
export interface VaultMetadataResponse<
  TCustomMeta extends KvObject = KvObject
> {
  data: {
    created_time: string;
    custom_metadata: TCustomMeta;
    deletion_time: string;
    destroyed: boolean;
    version: number;
    [key: string]: unknown;
  };
}

// Define the structure of the Vault KV write payload
export interface VaultKvWriteOptions {
  cas?: number;
}

// Define the structure of the Vault KV write payload
export interface VaultKvWritePayload {
  options?: VaultKvWriteOptions;
  data: {
    [key: string]: string;
  };
}

// Define the structure of the sign response
export interface SignResponse {
  data: {
    signature: string;
  };
}

// Define the structure of the encrypt response
export interface VaultEncryptResponse {
  data: {
    ciphertext: string;
  };
}

// Define the structure of the login response
export interface AuthResponse {
  auth: {
    client_token: string;
  };
}

// Define the structure of the encrypt payload
export interface VaultEncryptPayload {
  plaintext: string;
}

// Define the structure of the create key payload
export interface VaultTransitImportRsaPublicKeyPayload {
  type: 'rsa-2048' | 'rsa-3072' | 'rsa-4096';
  public_key: string;
  allow_rotation?: boolean;
  exportable?: boolean;
  allow_plaintext_backup?: boolean;
}

// Define the structure of the login payload
export interface VaultLoginPayload {
  name: string;
}
