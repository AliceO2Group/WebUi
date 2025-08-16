import path from "path";
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
      config.centralAddress || "localhost"
    );
  }

  /**
   * @description Starts the Connection Manager stream connection with Central System
   */
  public connectToCentralSystem(): void {
    this.ConnectionManager.connectToCentralSystem();
  }
}

const PROTO_PATH = path.join(__dirname, "../proto/wrapper.proto");
const grpc = new gRPCWrapper({
  protoPath: PROTO_PATH,
  centralAddress: "localhost:50051",
});
grpc.connectToCentralSystem();
