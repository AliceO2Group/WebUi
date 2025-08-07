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

const fs = require("fs");
const path = require("path");

const banner = `/**
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
`;

const processFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    if (content.trim().startsWith(banner.trim())) {
      return;
    }

    const newContent = banner + "\n" + content;
    fs.writeFileSync(filePath, newContent, "utf8");
    console.log(`Added banner to: ${filePath}`);
  } catch (err) {
    console.error(`Error with file ${filePath}:`, err);
  }
};

const excludedDirs = ["node_modules", "dist"];
const walkDir = (dir) => {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory() && !excludedDirs.includes(fullPath)) {
      walkDir(fullPath);
    } else if (file.isFile()) {
      if (/\.(js|ts|jsx|tsx|mjs|cjs)$/.test(file.name)) {
        processFile(fullPath);
      }
    }
  }
};

const startDir = "./src/";
walkDir(startDir);
console.log("Banners processed.");
