import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import {
  DuplexMessageEvent,
  DuplexMessageModel,
} from "../models/message.model.ts";

/**
 * @description Central System gRPC wrapper that manages client connections and handles gRPC streams with them.
 */
export class CentralSystemWrapper {
  private server: grpc.Server;
  private clientStreams = new Map<string, grpc.ServerDuplexStream<any, any>>();

  constructor(private port: number) {
    this.server = new grpc.Server();
    this.setupService();
    this.start();
  }

  private setupService() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const PROTO_PATH = path.join(__dirname, "../proto/wrapper.proto");
    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const wrapper = proto.wrapper;

    this.server.addService(wrapper.CentralSystem.service, {
      ClientStream: this.clientStreamHandler.bind(this),
    });
  }

  private clientStreamHandler(call: grpc.ServerDuplexStream<any, any>) {
    console.log("Client connected to duplex stream");

    const clientAddress = call.getPeer();

    this.clientStreams.set(clientAddress, call);
    console.log(`Registered client stream for: ${clientAddress}`);

    // hartbeat message
    call.write({ event: "EMPTY_EVENT", data: "registered in central system." });

    call.on("data", (payload: any) => {
      console.log(`Received from ${clientAddress}:`, payload);
    });

    call.on("end", () => {
      console.log(`Client ${clientAddress} ended stream`);
      this.clientStreams.delete(clientAddress);
      call.end();
    });

    call.on("error", (err) => {
      console.error(`Stream error for ${clientAddress}:`, err);
      this.clientStreams.delete(clientAddress);
    });
  }

  private start() {
    const addr = `localhost:${this.port}`;
    this.server.bindAsync(
      addr,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          console.error("Server bind error:", err);
          return;
        }
        console.log(`Server listening on ${addr}`);
      }
    );
  }

  /**
   * @description Returns all client addresses
   */
  public getClients() {
    return this.clientStreams.keys();
  }

  /**
   * @description Sends message event to specific client
   */
  public clientSend(clientAddress: string, message: DuplexMessageModel) {
    const stream = this.clientStreams.get(clientAddress);
    if (!stream) {
      console.warn(`No active stream for client ${clientAddress}`);
      return;
    }
    stream.write(message);
  }
}

// tests
const centralSystem = new CentralSystemWrapper(50051);
setTimeout(() => {
  const client = Array.from(centralSystem.getClients())[0];
  console.log(client);

  // send new token
  centralSystem.clientSend(client, {
    event: DuplexMessageEvent.NEW_TOKEN,
    newToken: {
      token: "new token",
      targetAddress: "a",
    },
  });

  // revoke token
  centralSystem.clientSend(client, {
    event: DuplexMessageEvent.REVOKE_TOKEN,
    revokeToken: {
      token: "new token",
      targetAddress: "a",
    },
  });
}, 5000);
