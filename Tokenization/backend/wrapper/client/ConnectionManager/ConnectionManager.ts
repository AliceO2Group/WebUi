import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

/**
 * @description Manages all the connection between clients and central system.
 */
export class ConnectionManager {
  private client: any;
  private stream?: grpc.ClientDuplexStream<any, any>;
  private readonly address: string;
  private reconnectAttempts = 0;

  constructor(centralAddress = "localhost:50051") {
    this.address = centralAddress;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const PROTO_PATH = path.join(__dirname, "../../proto/wrapper.proto");
    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const wrapper = proto.wrapper;

    // Create gRPC client
    this.client = new wrapper.CentralSystem(
      this.address,
      grpc.credentials.createInsecure()
    );

    // Initial connection
    this.connect();
    console.log(`ConnectionManager: connected to ${this.address}`);
  }

  /**
   * @description Initializes the duplex stream and sets up handlers.
   */
  private connect() {
    this.stream = this.client.ClientStream();

    if (this.stream) {
      this.stream.on("data", (payload) => {
        // handle data received from the stream
      });

      this.stream.on("end", () => {
        console.warn("Stream ended, attempting to reconnect...");
        this.scheduleReconnect();
      });

      this.stream.on("error", (err: any) => {
        console.error("Wrapper stream error:", err);
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
      console.log(`Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  /**
   * @description Disconnects from the gRPC stream and resets attempts.
   */
  disconnect() {
    if (this.stream) {
      this.stream.end();
      this.stream = undefined;
    }
    this.reconnectAttempts = 0;
    console.log("Disconnected from central");
  }
}
