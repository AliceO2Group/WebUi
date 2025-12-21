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
import * as grpc from '@grpc/grpc-js';
import type { ConnectionDirection } from '../../models/message.model';
import { ConnectionStatus } from '../../models/connection.model';
import type { Connection } from '../../client/connection/Connection';
import { GRPCAuthInterceptor } from '../../client/connectionManager/interceptors/grpc.auth.interceptor';
import type { SecurityContext } from '../security/SecurityContext';

/**
 * Listens for incoming gRPC requests and forwards them to the local API endpoint.
 * Creates a new incoming connection if one doesn't exist yet.
 *
 * @param call - The gRPC unary call object containing the request.
 * @param callback - The callback function to be called with the response.
 * @param logger - The logger object to write info and error messages.
 * @param receivingConnections - The map of existing incoming connections.
 * @param createNewConnection - Function to create a new Connection instance.
 * @param baseAPIPath - The base path of the local API endpoint.
 */
export const peerListener = async (
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
  logger: any,
  receivingConnections: Map<string, Connection>,
  createNewConnection: (address: string, direction: ConnectionDirection, token?: string | undefined) => Promise<Connection>,
  securityContext: SecurityContext,
  baseAPIPath: string
) => {
  // Create a minimal ConnectionManager interface for the interceptor
  const connectionManagerInterface = {
    getConnectionByAddress: (address: string, _direction: ConnectionDirection) => receivingConnections.get(address),
    createNewConnection: createNewConnection,
    sendCentralAlert: () => {
      // Peer listener doesn't have access to central connection, so we just log
      logger.warnMessage('Alert would be sent to central system if connection was available');
    },
  };

  // Run auth interceptor
  const interceptor = new GRPCAuthInterceptor(connectionManagerInterface as any, securityContext);
  const { isAuthenticated, conn } = await interceptor.validate(call, callback);

  if (!isAuthenticated || !conn) {
    // Authentication failed - response already sent in interceptor
    return;
  }

  try {
    const clientAddress = call.getPeer();
    logger.infoMessage(`Incoming request from ${clientAddress}`);

    conn.status = ConnectionStatus.CONNECTED;
    receivingConnections.set(clientAddress, conn);

    // Create request to forward to local API endpoint
    const method = String(call.request?.method ?? 'POST').toUpperCase();
    const url = baseAPIPath + (call.request?.path ?? '');
    const headers: { [key: string]: string } = call.request?.headers;
    const body = call.request?.body ? Buffer.from(call.request.body).toString('utf-8') : undefined;

    logger.infoMessage(`Received payload from ${clientAddress}: \n${url}\n${JSON.stringify(headers)}\n${JSON.stringify(body)}\n`);

    const httpResp = await fetch(url, {
      method,
      headers: headers,
      body,
    });

    const respHeaders: Record<string, string> = {};
    httpResp.headers.forEach((v, k) => (respHeaders[k] = v));
    const resBody = Buffer.from(await httpResp.arrayBuffer());

    callback(null, {
      status: httpResp.status,
      headers: respHeaders,
      body: resBody,
    });
  } catch (e: any) {
    logger.errorMessage(`Error forwarding request: ${e ?? 'Uknown error'}`);

    callback({
      code: grpc.status.INTERNAL,
      message: e?.message ?? 'forward error',
    } as any);
  }
};
