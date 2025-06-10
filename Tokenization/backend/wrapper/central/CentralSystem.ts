import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

export class CentralSystem {
  private server: grpc.Server;

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

    // hartbeat message
    call.write({ event: "EMPTY_EVENT", emptyMessage: {} });

    call.on("data", (payload: any) => {
      // TODO: Implement data handling logic
    });

    call.on("end", () => {
      console.log("Client ended stream");
      call.end();
    });

    call.on("error", (err) => console.error("Stream error:", err));
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
}

const centralSystem = new CentralSystem(50051);
