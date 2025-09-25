import { CentralSystemConfig, gRPCWrapperConfig } from "models/config.model";
import path from "path";
import * as fs from "fs";

export const getTestCentralCertPaths =
  (): CentralSystemConfig["serverCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const SERVER_CERT_PATH = path.join(
      __dirname,
      "./centralSystem/central.system.svc.local.crt"
    );
    const SERVER_KEY_PATH = path.join(
      __dirname,
      "./centralSystem/central.system.svc.local.key"
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
      "./clientListener/client-b.svc.local.crt"
    );
    const CLIENT_KEY_PATH = path.join(
      __dirname,
      "./clientListener/client-b.svc.local.key"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      keyPath: CLIENT_KEY_PATH,
    };
  };

export const getTestClientSenderCertPaths =
  (): gRPCWrapperConfig["clientCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const CLIENT_CERT_PATH = path.join(
      __dirname,
      "./clientSender/client-a.svc.local.crt"
    );
    const CLIENT_KEY_PATH = path.join(
      __dirname,
      "./clientSender/client-a.svc.local.key"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      keyPath: CLIENT_KEY_PATH,
    };
  };

export const getTestCerts = () => {
  const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
  const SERVER_CERT_PATH = path.join(
    __dirname,
    "./centralSystem/central.system.svc.local.crt"
  );
  const SERVER_KEY_PATH = path.join(
    __dirname,
    "./centralSystem/central.system.svc.local.key"
  );

  const caCert = fs.readFileSync(CA_CERT_PATH);
  const clientCert = fs.readFileSync(SERVER_CERT_PATH);
  const clientKey = fs.readFileSync(SERVER_KEY_PATH);

  return { caCert, clientCert, clientKey };
};
