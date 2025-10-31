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

import { CommandHandler } from "../../models/commands.model.js";
import { GetAllTokensCommand } from "./getAllTokens.command.js";
import { CentralSystemWrapper } from "../../CentralSystemWrapper.js";

export class GetAllTokensHandler
  implements CommandHandler<GetAllTokensCommand>
{
  constructor(
    private getTokens: (
      client: any,
      centralSystemWrapper: CentralSystemWrapper
    ) => Promise<void>,
    private _centralSystemWrapper: CentralSystemWrapper
  ) {
    this.getTokens = getTokens;
  }

  public async handle(
    command: GetAllTokensCommand & { clientSerialNumber?: string }
  ): Promise<void> {
    await this.getTokens(
      command.clientSerialNumber,
      this._centralSystemWrapper
    );
  }
}
