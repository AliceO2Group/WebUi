import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { LogManager } from "@aliceo2/web-ui";

/**
 * @description Central System gRPC wrapper that manages client connections and handles gRPC streams with them.
 */
export class CentralSystemWrapper {
  // utilities
  private logger = LogManager.getLogger("CentralSystemWrapper");

  // class properties
  private server: grpc.Server;

  /**
   * Initializes the Wrapper for CentralSystem.
   * @param port The port number to bind the gRPC server to.
   */
  constructor(private protoPath: string, private port: number) {
    this.server = new grpc.Server();
    this.setupService();
  }

  /**
   * @description Loads the gRPC proto definition and sets up the CentralSystem service.
   */
  private setupService(): void {
    // Load the proto definition with options
    const packageDef = protoLoader.loadSync(this.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    // Load the package definition into a gRPC object
    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const wrapper = proto.webui.tokenization;

    // Add the CentralSystem service and bind the stream handler
    this.server.addService(wrapper.CentralSystem.service, {
      ClientStream: this.clientStreamHandler.bind(this),
    });
  }

  /**
   * @description Handles the duplex stream from the client.
   * @param call The duplex stream call object.
   */
  private clientStreamHandler(call: grpc.ServerDuplexStream<any, any>): void {
    this.logger.infoMessage(
      `Client ${call.getPeer()} connected to CentralSystem stream stream`
    );

    // Listen for data events from the client
    call.on("data", (payload: any) => {
      console.log(`Received from ${call.getPeer()}:`, payload);
    });

    // Handle stream end event
    call.on("end", () => {
      this.logger.infoMessage(`Client ${call.getPeer()} ended stream.`);
      call.end();
    });

    // Handle stream error event
    call.on("error", (err) =>
      this.logger.infoMessage(
        `Stream error from client ${call.getPeer()}:`,
        err
      )
    );
  }

  /**
   * @desciprion Starts the gRPC server and binds it to the specified in class port.
   */
  public listen() {
    const addr = `localhost:${this.port}`;
    this.server.bindAsync(
      addr,
      grpc.ServerCredentials.createInsecure(),
      (err, _port) => {
        if (err) {
          this.logger.infoMessage("Server bind error:", err);
          return;
        }
        this.logger.infoMessage(`CentralSytem started listening on ${addr}`);
      }
    );
  }
}

// Instantiate the CentralSystemWrapper on port 50051, but don't start automatically
const PROTO_PATH = path.join(__dirname, "../proto/wrapper.proto");
const centralSystem = new CentralSystemWrapper(PROTO_PATH, 50051);
// Start listening explicitly
centralSystem.listen();
