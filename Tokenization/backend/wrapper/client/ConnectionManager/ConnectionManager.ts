import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { LogManager } from "@aliceo2/web-ui";

/**
 * @description Manages all the connection between clients and central system.
 */
/**
 * Manages the lifecycle and connection logic for a gRPC client communicating with the central system.
 *
 * This class is responsible for:
 * - Initializing the gRPC client using the provided proto definition and address.
 * - Managing a duplex stream (`stream`) for bidirectional communication.
 * - Handling automatic reconnection with exponential backoff on stream errors or disconnects.
 * - Providing methods to start (`connectToCentralSystem`) and stop (`disconnect`) the connection with central system.
 *
 * @remarks
 * - `client`: The gRPC client instance for communicating with the central system.
 * - `stream`: The active duplex stream for sending and receiving messages (optional).
 * - `address`: The address of the central gRPC server.
 * - `reconnectAttempts`: The number of consecutive reconnection attempts made after a disconnect or error.
 */
export class ConnectionManager {
  // utilities
  private logger = LogManager.getLogger("ConnectionManager");

  // class properties
  private client: any;
  private stream?: grpc.ClientDuplexStream<any, any>;
  private readonly address: string;
  private reconnectAttempts = 0;

  /**
   * @description Initializes a new instance of the ConnectionManager class.
   *
   * This constructor sets up the gRPC client for communication with the central system.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   */
  constructor(protoPath: string, centralAddress: string = "localhost:50051") {
    this.address = centralAddress;

    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const wrapper = proto.webui.tokenization;

    // Create gRPC client
    this.client = new wrapper.CentralSystem(
      this.address,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * @description Initializes the duplex stream and sets up handlers.
   */
  private connect() {
    if (this.stream) return;
    this.stream = this.client.ClientStream();

    if (this.stream) {
      this.stream.on("data", (payload) => {
        // handle data received from the stream
      });

      this.stream.on("end", () => {
        this.logger.infoMessage(`Stream ended, attempting to reconnect...`);
        this.stream = undefined;
        this.scheduleReconnect();
      });

      this.stream.on("error", (err: any) => {
        this.logger.infoMessage(
          `Stream error:`,
          err,
          " attempting to reconnect..."
        );
        this.stream = undefined;
        this.scheduleReconnect();
      });
    }
  }

  /**
   * @description Schedules a reconnect with exponential backoff.
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => {
      this.logger.infoMessage(
        `Reconnecting (attempt ${this.reconnectAttempts})...`
      );
      this.connect();
    }, delay);
  }

  /**
   * @description Starts the connection to the central system.
   */
  public connectToCentralSystem() {
    if (!this.stream) {
      this.connect();
      this.logger.infoMessage(
        `Connected to CentralSystem service at ${this.address}`
      );
    }
  }

  /**
   * @description Disconnects from the gRPC stream and resets attempts.
   */
  public disconnect() {
    if (this.stream) {
      this.stream.end();
      this.stream = undefined;
    }
    this.reconnectAttempts = 0;
    this.logger.infoMessage(`Disconnected from CentralSystem service`);
  }
}
