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

module.exports = {
  http: {
    port: 8080,
    // portSecure: 8443,
    hostname: 'localhost',
    // key: './cert/key.pem',
    // cert: './cert/cert.pem',
    tls: false,
  },
  grpc: {
    hostname: 'localhost',
    port: 9090,
    timeout: 10000,
  },
  kafka: {
    hostnames: 'localhost',
    port: 9092,
    topic: 'notifications',
    groupId: 'flp-kafka-notifications'
  },
  consul: {
    hostname: 'localhost',
    port: 8550,
    flpHardwarePath: 'test/o2/hardware/flps'
  },
  grafana: {
    hostname: 'localhost',
    port: 2020
  }
};
