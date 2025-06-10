import { ConnectionManager } from "./ConnectionManager/ConnectionManager.ts";

export class gRPCWrapper {
  private ConnectionManager: ConnectionManager;

  constructor() {
    this.ConnectionManager = new ConnectionManager();
  }
}

const grpc = new gRPCWrapper();
