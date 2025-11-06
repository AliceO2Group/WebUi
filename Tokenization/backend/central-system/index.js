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

import { HttpServer } from '@aliceo2/web-ui';

import CentralSystem from './dist/modules/CentralSystem.js';

const http = new HttpServer({ port: 8080, allow: '*' });

http.get(
  '/healthcheck',
  (req, res) => {
    res.status(200).send();
  },
  { public: true }
);

const centralSystemModel = new CentralSystem(4041);
http.get(
  '/tokens',
  centralSystemModel.tokenController.getTokensHandler.bind(
    centralSystemModel.tokenController
  ),
  {
    public: true,
  }
);

http.post(
  '/tokens/create',
  centralSystemModel.tokenController.createTokenHandler.bind(
    centralSystemModel.tokenController
  ),
  { public: true }
);

http.post(
  '/tokens/revoke',
  centralSystemModel.tokenController.revokeTokenHandler.bind(
    centralSystemModel.tokenController
  ),
  { public: true }
);
