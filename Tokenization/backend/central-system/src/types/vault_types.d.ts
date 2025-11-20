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
  data: { input: string };
}

// Define the structure of the Vault read response
export interface VaultReadResponse {
  data: {
    data: {
      foo: string;
    };
    metadata: {
      created_time: string;
      custom_metadata: {
        owner: string;
        mission_critical: string;
      };
      deletion_time: string;
      destroyed: boolean;
      version: number;
    };
  };
}

// Define the structure of the Vault metadata response
export interface VaultMetadataResponse {
  data: {
    created_time: string;
    custom_metadata: {
      owner: string;
      mission_critical: string; 
    };
    deletion_time: string;
    destroyed: boolean;
    version: number;
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