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

import { ConnectionManager } from "./ConnectionManager/ConnectionManager.ts";
import { gRPCWrapperConfig } from "../models/config.model.ts";

/**
 * @description Wrapper class for managing secure gRPC wrapper.
 *
 * @remarks
 * This class serves as a high-level abstraction over the underlying
 * `ConnectionManager`, providing a simplified interface for establishing
 * and managing gRPC connections within the application.
 *
 * @example
 * ```typescript
 * const grpcWrapper = new gRPCWrapper();
 * // Use grpcWrapper to interact with gRPC services
 * ```
 */
export class gRPCWrapper {
  private ConnectionManager: ConnectionManager;

  /**
   * @description Initializes an instance of gRPCWrapper class.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   */
  constructor(config: gRPCWrapperConfig) {
    this.ConnectionManager = new ConnectionManager(
      config.protoPath,
      config.centralAddress
    );
  }

  /**
   * @description Starts the Connection Manager stream connection with Central System
   */
  public connectToCentralSystem(): void {
    this.ConnectionManager.connectToCentralSystem();
  }
}
