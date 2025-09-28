import { CentralSystemConfig, gRPCWrapperConfig } from "models/config.model";
import path from "path";
import * as fs from "fs";

export const getTestCentralCertPaths =
  (): CentralSystemConfig["serverCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const SERVER_CERT_PATH = path.join(
      __dirname,
      "./centralSystem/central-system.crt"
    );
    const SERVER_KEY_PATH = path.join(
      __dirname,
      "./centralSystem/central-system.key"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: SERVER_CERT_PATH,
      keyPath: SERVER_KEY_PATH,
    };
  };

export const getTestClientListenerCertPaths =
  (): gRPCWrapperConfig["clientCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const CLIENT_CERT_PATH = path.join(
      __dirname,
      "./clientListener/client-b-client.crt"
    );
    const CLIENT_KEY_PATH = path.join(
      __dirname,
      "./clientListener/client-b.key"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      publicKeyPath: CLIENT_KEY_PATH,
    };
  };

export const getTestClientListenerServerCertPaths =
  (): gRPCWrapperConfig["clientCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const CLIENT_CERT_PATH = path.join(
      __dirname,
      "./clientListenerServer/client-b-server.crt"
    );
    const CLIENT_KEY_PATH = path.join(
      __dirname,
      "./clientListenerServer/client-b.key"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      publicKeyPath: CLIENT_KEY_PATH,
    };
  };

export const getTestClientSenderCertPaths =
  (): gRPCWrapperConfig["clientCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const CLIENT_CERT_PATH = path.join(
      __dirname,
      "./clientSender/client-a-client.crt"
    );
    const CLIENT_KEY_PATH = path.join(__dirname, "./clientSender/client-a.key");

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      publicKeyPath: CLIENT_KEY_PATH,
    };
  };

export const getTestCerts = () => {
  const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
  const SERVER_CERT_PATH = path.join(
    __dirname,
    "./centralSystem/central-system.crt"
  );
  const SERVER_KEY_PATH = path.join(
    __dirname,
    "./centralSystem/central-system.key"
  );

  const caCert = fs.readFileSync(CA_CERT_PATH);
  const clientCert = fs.readFileSync(SERVER_CERT_PATH);
  const clientKey = fs.readFileSync(SERVER_KEY_PATH);

  return { caCert, clientCert, clientKey };
};
