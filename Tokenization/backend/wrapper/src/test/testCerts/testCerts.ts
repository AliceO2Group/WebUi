/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

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
    const CLIENT_PRIVATE_KEY_PATH = path.join(
      __dirname,
      "./clientListener/client-b.key"
    );
    const CLIENT_PUBLIC_KEY_PATH = path.join(
      __dirname,
      "./clientListener/client-b.pub.pem"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      privateKeyPath: CLIENT_PRIVATE_KEY_PATH,
      publicKeyPath: CLIENT_PUBLIC_KEY_PATH,
    };
  };

export const getTestClientListenerServerCertPaths =
  (): gRPCWrapperConfig["clientCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const CLIENT_CERT_PATH = path.join(
      __dirname,
      "./clientListenerServer/client-b-server.crt"
    );
    const CLIENT_PRIVATE_KEY_PATH = path.join(
      __dirname,
      "./clientListener/client-b.key"
    );
    const CLIENT_PUBLIC_KEY_PATH = path.join(
      __dirname,
      "./clientListener/client-b.pub.pem"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      publicKeyPath: CLIENT_PUBLIC_KEY_PATH,
      privateKeyPath: CLIENT_PRIVATE_KEY_PATH,
    };
  };

export const getTestClientSenderCertPaths =
  (): gRPCWrapperConfig["clientCerts"] => {
    const CA_CERT_PATH = path.join(__dirname, "./ca.crt");
    const CLIENT_CERT_PATH = path.join(
      __dirname,
      "./clientSender/client-a-client.crt"
    );
    const CLIENT_PRIVATE_KEY_PATH = path.join(
      __dirname,
      "./clientSender/client-a.key"
    );
    const CLIENT_PUBLIC_KEY_PATH = path.join(
      __dirname,
      "./clientSender/client-a.pub.pem"
    );

    return {
      caCertPath: CA_CERT_PATH,
      certPath: CLIENT_CERT_PATH,
      privateKeyPath: CLIENT_PRIVATE_KEY_PATH,
      publicKeyPath: CLIENT_PUBLIC_KEY_PATH,
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
