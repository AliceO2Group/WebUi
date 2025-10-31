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
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private token: string;
  private targetAddress: string;

  constructor(token: string, targetAddress: string) {
    this.token = token;
    this.targetAddress = targetAddress;
  }

  public handleNewToken(token: string): void {
    this.token = token;
  }
}
