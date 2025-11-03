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

export interface CentralSystemConfig {
  /** Path to the proto file defining the services. */
  protoPath: string;
  /** Host/IP to bind the gRPC server on. Defaults to "0.0.0.0" which is docker-friendly. */
  host?: string;
  /** Port to bind. Defaults to 50051. */
  port?: number;
}

export interface gRPCWrapperConfig {
  /** Path to the proto file defining the services. */
  protoPath: string;
  /** Address of the CentralSystem server. */
  centralAddress: string;
}
