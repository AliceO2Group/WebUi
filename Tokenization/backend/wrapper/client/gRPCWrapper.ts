import { ConnectionManager } from "./ConnectionManager/ConnectionManager.ts";

export class gRPCWrapper {
  private ConnectionManager: ConnectionManager;

  constructor() {
    this.ConnectionManager = new ConnectionManager();
  }
}

// tests
const grpc = new gRPCWrapper();
