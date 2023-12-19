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
import {HttpServer} from "@aliceo2/web-ui-backend";
import * as path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Reading config file
// Start servers
const http = new HttpServer({hostname: 'localhost', port: 8085}, {});
http.addStaticPath(path.join(__dirname, 'public'));

http.post('/ok.json', replyWithOk);
http.get('/ok.json', replyWithOk);

/**
 * Reply for API calls
 * @param {Request} req
 * @param {Response} res
 */
function replyWithOk(req, res) {
  res.set({
    'Content-type': 'application/json'
  });
  res.status(200).json({ok: req.method});
}
