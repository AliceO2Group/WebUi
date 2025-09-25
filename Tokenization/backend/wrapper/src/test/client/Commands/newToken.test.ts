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

import { NewTokenCommand } from "../../../client/Commands/newToken/newToken.command";
import { NewTokenHandler } from "../../../client/Commands/newToken/newToken.handler";
import { Connection } from "../../../client/Connection/Connection";
import { ConnectionManager } from "../../../client/ConnectionManager/ConnectionManager";
import { Command } from "models/commands.model";
import {
  ConnectionDirection,
  DuplexMessageEvent,
} from "../../../models/message.model";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { getTestCerts } from "../../testCerts/testCerts";

/**
 * Helper to create a new token command with given address, direction, and token.
 */
function createEventMessage(
  targetAddress: string,
  connectionDirection: ConnectionDirection
): Command {
  return {
    event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
    payload: {
      targetAddress,
      connectionDirection,
      token: "test-token",
    },
  } as Command;
}

describe("NewTokenHandler", () => {
  let manager: ConnectionManager;

  const protoPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "proto",
    "wrapper.proto"
  );
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

  beforeEach(() => {
    manager = {
      sendingConnections: new Map<string, Connection>(),
      receivingConnections: new Map<string, Connection>(),
      getConnectionByAddress: jest.fn(function (
        this: any,
        address: string,
        dir: ConnectionDirection
      ) {
        if (dir === ConnectionDirection.SENDING) {
          return this.sendingConnections.get(address);
        } else if (dir === ConnectionDirection.RECEIVING) {
          return this.receivingConnections.get(address);
        }
        return undefined;
      }),
      createNewConnection: jest.fn(function (
        this: any,
        address: string,
        dir: ConnectionDirection,
        token: string
      ) {
        const conn = new Connection(
          token,
          address,
          dir,
          peerCtor,
          getTestCerts()
        );
        if (dir === ConnectionDirection.SENDING) {
          this.sendingConnections.set(address, conn);
        } else {
          this.receivingConnections.set(address, conn);
        }
        return conn;
      }),
    } as unknown as ConnectionManager;
  });

  it("should update token on existing SENDING connection", async () => {
    const targetAddress = "peer-123";
    const conn = new Connection(
      "old-token",
      targetAddress,
      ConnectionDirection.SENDING,
      peerCtor,
      getTestCerts()
    );

    (manager as any).sendingConnections.set(targetAddress, conn);

    const handler = new NewTokenHandler(manager);
    const command = new NewTokenCommand(
      createEventMessage(targetAddress, ConnectionDirection.SENDING).payload
    );

    await handler.handle(command);

    expect(conn.getToken()).toBe("test-token");
  });

  it("should create new RECEIVING connection if not found", async () => {
    const targetAddress = "peer-456";

    const handler = new NewTokenHandler(manager);
    const command = new NewTokenCommand(
      createEventMessage(targetAddress, ConnectionDirection.RECEIVING).payload
    );

    await handler.handle(command);

    const conn = (manager as any).receivingConnections.get(targetAddress);
    expect(conn).toBeDefined();
    expect(conn.getToken()).toBe("test-token");
  });

  it("should handle DUPLEX direction by updating/creating both connections", async () => {
    const targetAddress = "peer-789";

    const handler = new NewTokenHandler(manager);
    const command = new NewTokenCommand(
      createEventMessage(targetAddress, ConnectionDirection.DUPLEX).payload
    );

    await handler.handle(command);

    const sendingConn = (manager as any).sendingConnections.get(targetAddress);
    const receivingConn = (manager as any).receivingConnections.get(
      targetAddress
    );

    expect(sendingConn).toBeDefined();
    expect(receivingConn).toBeDefined();
    expect(sendingConn.getToken()).toBe("test-token");
    expect(receivingConn.getToken()).toBe("test-token");
  });

  it("should throw error when payload is missing required fields", async () => {
    const invalidCommand = new NewTokenCommand({} as any);

    const handler = new NewTokenHandler(manager);
    await expect(handler.handle(invalidCommand)).rejects.toThrow(
      "Insufficient arguments. Expected: targetAddress, connectionDirection, token."
    );
  });

  it("should create command with correct event and payload", () => {
    const payload = {
      targetAddress: "peer-000",
      connectionDirection: ConnectionDirection.SENDING,
      token: "sample-token",
    };

    const command = new NewTokenCommand(payload);

    expect(command.event).toBe(DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN);
    expect(command.payload).toEqual(payload);
  });
});
