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

// Request and Response types for event handling

import { VaultKvWritePayload } from '../../types/vault_types.js';

type SignTokenReq = {
  data: { input: string };
  claims?: Record<string, unknown>;
};
type GetCredentialReq = { path: string; claims?: Record<string, unknown> };
type CreateOrUpdateCredentialReq = {
  path: string;
  body: VaultKvWritePayload;
  claims?: Record<string, unknown>;
};

export type { SignTokenReq, GetCredentialReq, CreateOrUpdateCredentialReq };
