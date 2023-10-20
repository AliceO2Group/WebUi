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
    label: 'Control',
    package: 'o2control'
  },
  apricot: {
    hostname: 'localhost',
    port: 9091,
    timeout: 10000,
    label: 'Apricot',
    package: 'apricot'
  },
  consul: {
    ui: 'localhost.cern.ch',
    hostname: 'localhost',
    port: 8550,
    flpHardwarePath: 'test/o2/hardware/flps',
    detHardwarePath: 'test/o2/hardware/detectors',
    readoutPath: 'test/o2/readout/components',
    readoutCardPath: 'test/o2/readoutcard/components',
    qcPath: 'test/o2/qc/components',
    kVPrefix: 'test/ui/some-cluster/kv',
  },
  infoLoggerGui: {
    url: 'http://localhost:8081',
  },
  infoLoggerEpnGui: {
    url: 'http://localhost:8083',
  },
  grafana: {
    url: 'http://localhost:2020'
  },
  bookkeepingGui: {
    url: 'http://localhost:2021'
  },
  bookkeeping: {
    url: 'http://localhost:2021',
  },
  qcGui: {
    url: 'http://localhost:2022'
  },
  utils: {
    refreshTask: 5000, // how often should task list page should refresh its content
  }
};
