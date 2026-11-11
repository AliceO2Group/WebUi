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

import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig } from 'vite';

const webUi = path.resolve(import.meta.dirname, 'node_modules/@aliceo2/web-ui');
const requireFromWebUi = createRequire(path.join(webUi, 'package.json'));

export default defineConfig({
  resolve: {
    alias: [
      // Map the Framework's absolute paths into its package
      { find: /^\/(js|css)\//, replacement: `${path.join(webUi, 'Frontend')}/$1/` },
      // Bundled build of Mithril will not set window.m so wrap it
      { find: '/mithril/mithril.min.js', replacement: path.resolve(import.meta.dirname, 'src/mithril-global.js') },
      // When the Framework is linked in dev, Mithril is only installed inside the Framework, so resolve it from there
      { find: /^mithril$/, replacement: requireFromWebUi.resolve('mithril') },
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
