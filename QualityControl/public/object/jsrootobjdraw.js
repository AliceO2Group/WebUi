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

/* global JSROOT */

import {h} from '/js/src/index.js';

/**
 * Plo
 * @param {Object} model 
 */
export default async (model) => {
  console.log("aicis);")
  // var filename = "http://localhost:8083/qc/DAQ/MO/daqTask/inputRecordSize/1605307363188";
  var filename = "http://ccdb-test.cern.ch:8080/qc/TST/MO/Test/pid45499/a/1612886035583";
  filename = 'http://localhost:8080/ccdb-plot/qc/ITS/QO/ITSFHRChecker/1614930493540';

  // JSROOT.NewHttpRequest(filename, 'object', function(obj) {
  //   console.log(obj);
  //   console.log("obj");
  //   JSROOT.draw("drawing", obj, "lego");
  // }).send();
    // let file = await JSROOT.openFile(filename);
    // let obj = await file.readObject("ccdb_object;1");
    // await JSROOT.draw("drawing", obj, "colz");
//  }

  JSROOT.openFile(filename)
    .then(file => file.readObject("ccdb_object;1"))
    .then(obj => {
      console.log(obj)
      JSROOT.draw("drawing", obj, "colz")
    })
}; 
