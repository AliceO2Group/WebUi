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

import { RevokeTokenCommand } from '../../../client/Commands/revokeToken/revokeToken.command';
import { RevokeTokenHandler } from '../../../client/Commands/revokeToken/revokeToken.handler';
import { Connection } from '../../../client/connection/Connection';
import { ConnectionManager } from '../../../client/connectionManager/ConnectionManager';
import { ConnectionDirection, DuplexMessageEvent } from '../../../models/message.model';
import { ConnectionStatus } from '../../../models/connection.model';
import { Command } from 'models/commands.model';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { getTestCerts } from '../../testCerts/testCerts';

// Mock logger
jest.mock(
  '@aliceo2/web-ui',
  () => ({
    LogManager: {
      getLogger: () => ({
        infoMessage: jest.fn(),
        debugMessage: jest.fn(),
        errorMessage: jest.fn(),
      }),
    },
  }),
  { virtual: true }
);

describe('RevokeToken', () => {
  const protoPath = path.join(__dirname, '..', '..', '..', '..', '..', 'proto', 'wrapper.proto');
  const packageDef = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDef) as any;
  const wrapper = proto.webui.tokenization;
  const peerCtor = wrapper.Peer2Peer;

  const createEventMessage = (targetAddress: string) => {
    return {
      event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
      payload: {
        singleToken: {
          targetAddress: targetAddress,
          token: 'test-token',
          connectionDirection: ConnectionDirection.SENDING,
        },
      },
    } as Command;
  };

  let manager: ConnectionManager;

  beforeEach(() => {
    manager = {
      sendingConnections: new Map<string, Connection>(),
      receivingConnections: new Map<string, Connection>(),
      getConnectionByAddress: jest.fn(function (this: any, address: string) {
        return this.sendingConnections.get(address) || this.receivingConnections.get(address);
      }),
    } as unknown as ConnectionManager;
  });

  it('should revoke token when connection found in sendingConnections', async () => {
    const targetAddress = 'peer-123';
    const conn = new Connection('valid-token', targetAddress, ConnectionDirection.SENDING, null as any);
    conn.createSslTunnel(peerCtor, getTestCerts());
    (manager as any).sendingConnections!.set(targetAddress, conn);

    const handler = new RevokeTokenHandler(manager);
    const command = new RevokeTokenCommand(createEventMessage(targetAddress).payload);

    await handler.handle(command);

    expect(conn.token).toBe('');
    expect(conn.status).toBe(ConnectionStatus.UNAUTHORIZED);
  });

  it('should revoke token when connection found in receivingConnections', async () => {
    const targetAddress = 'peer-456';
    const conn = new Connection('valid-token', targetAddress, ConnectionDirection.RECEIVING, null as any);
    (manager as any).receivingConnections.set(targetAddress, conn);

    const handler = new RevokeTokenHandler(manager);
    const command = new RevokeTokenCommand(createEventMessage(targetAddress).payload);

    await handler.handle(command);

    expect(conn.token).toBe('');
    expect(conn.status).toBe(ConnectionStatus.UNAUTHORIZED);
  });

  it('should do nothing when connection not found', async () => {
    const targetAddress = 'non-existent';
    const handler = new RevokeTokenHandler(manager);
    const command = new RevokeTokenCommand(createEventMessage(targetAddress).payload);

    await expect(handler.handle(command)).resolves.toBeUndefined();
    expect(manager.getConnectionByAddress).toHaveBeenCalledWith(targetAddress, 'SENDING');
  });

  it('should throw error when targetAddress is missing', async () => {
    const invalidMessage = {
      event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
      revokeToken: { token: 'test-token' },
    };

    const handler = new RevokeTokenHandler(manager);
    const command = new RevokeTokenCommand(invalidMessage as any);

    await expect(handler.handle(command)).rejects.toThrow('Target address and connection direction are required to revoke token.');
  });

  it('should create command with correct type and payload', () => {
    const eventMessage = createEventMessage('peer-001');
    const command = new RevokeTokenCommand(eventMessage.payload);

    expect(command.event).toBe(DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN);
    expect(command).toEqual(eventMessage);
  });
});
