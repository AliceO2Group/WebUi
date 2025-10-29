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

/// Event types for vault operations
export enum EventType {
  SIGN_TOKEN_VAULT = "SIGN_TOKEN_VAULT",
  LOGIN_VAULT = "LOGIN_VAULT",
  RENEW_VAULT_TOKEN = "RENEW_VAULT_TOKEN",
  GET_CREDENTIAL_VAULT = "GET_CREDENTIAL_VAULT",
  CREATE_OR_UPDATE_CREDENTIAL_VAULT = "CREATE_OR_UPDATE_CREDENTIAL_VAULT",
}
