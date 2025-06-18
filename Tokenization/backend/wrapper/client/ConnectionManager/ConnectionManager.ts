import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { Connection } from "../Connection/Connection.ts";
import { DuplexMessageEvent } from "../../models/message.model.ts";

/**
 * @description Manages all the connection between clients and central system.
 */
export class ConnectionManager {
  private client: any;
  private stream?: grpc.ClientDuplexStream<any, any>;
  private readonly address: string;
  private reconnectAttempts = 0;

  // Map to store sending connections by target address
  private sendingConnections: Map<string, Connection> = new Map();

  // Map to store receiving connections by target address
  private receivingConnections: Map<string, Connection> = new Map();

  constructor(centralAddress = "localhost:50049") {
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

    this.sendingConnections.set("a", new Connection("1", "a"));
    this.sendingConnections.set("b", new Connection("2", "b"));
  }

  /**
   * @description Initializes the duplex stream and sets up handlers.
   */
  private connect() {
    this.stream = this.client.ClientStream();

    if (this.stream) {
      this.stream.on("data", (payload) => {
        switch (payload.event) {
          // Central system replacing a new token for existing connection
          case DuplexMessageEvent.EMPTY_EVENT:
            break;
          case DuplexMessageEvent.NEW_TOKEN:
            this.handleNewToken(
              payload.newToken.token,
              payload.newToken.targetAddress
            );
            break;
          default:
            console.warn(`Unhandled event: ${payload.event}`);
        }
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
   * @description Handles a new token received from the central system and replaces it in proper Connection object.
   * @param newToken
   */
  private handleNewToken(newToken: string, targetAddress: string) {
    console.log(`Received new token for ${targetAddress}: ${newToken}`);

    // Check if we have a sending connection for this target address
    const sendingConnection = this.sendingConnections.get(targetAddress);
    if (sendingConnection) {
      sendingConnection.handleNewToken(newToken);
      console.log(`Updated sending connection for ${targetAddress}`);
      console.log(sendingConnection.getToken());
    } else {
      console.warn(`No sending connection found for ${targetAddress}`);
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
