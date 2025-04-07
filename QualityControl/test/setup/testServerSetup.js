/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import puppeteer from 'puppeteer';
import { config } from '../config.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

/* eslint-disable no-console */

/**
 * Sets up the server for integration tests.
 * @returns {Promise<{url: string, page: object, browser: object, subprocess: object, subprocessOutput: string}>}
 * An object containing the URL, Puppeteer page, browser, subprocess, and subprocess output.
 */
export async function setupServerForIntegrationTests() {
  await copyMockDataFileToUse();

  let subprocessOutput = undefined;
  const url = `http://${config.http.hostname}:${config.http.port}/`;

  const subprocess = spawn('node', ['index.js', 'test/config.js'], {
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });
  subprocess.stdout.on('data', (chunk) => {
    subprocessOutput += chunk.toString();
  });
  subprocess.stderr.on('data', (chunk) => {
    subprocessOutput += chunk.toString();
  });

  // Start browser to test UI
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  // Listen to browser
  page.on('error', (pageerror) => {
    console.error('        ', pageerror);
  });
  page.on('pageerror', (pageerror) => {
    console.error('        ', pageerror);
  });
  page.on('console', (msg) => {
    for (let i = 0; i < msg.args().length; ++i) {
      console.log(`        ${msg.args()[i]}`);
    }
  });

  return { url, page, browser, subprocess, subprocessOutput };
};

/**
 * Terminate session and log
 * @param {object} browser - Puppeteer browser object
 * @param {string} subprocessOutput - Output of the subprocess
 * @param {object} subprocess - Subprocess object
 */
export const terminateSessionAndLog = async (
  browser,
  subprocessOutput,
  subprocess,
) => {
  await browser.close();
  console.log('---------------------------------------------');
  console.log('Output of server logs for the previous tests:');
  console.log(subprocessOutput);
  subprocess.kill();
};

/**
 * Method to copy the mock data file to use 'qcg-mock-data-template.json' so that
 * it can be used by the test suite and suffer changes without impacting the original file.
 * If file does not exist, create it, first.
 */
export const copyMockDataFileToUse = async () => {
  const sourceFile = path.resolve('test/setup/seeders/qcg-mock-data-template.json');
  const destinationFile = path.resolve('test/setup/seeders/qcg-mock-data.json');
  try {
    await fs.access(destinationFile);
  } catch {
    await fs.writeFile(destinationFile, '');
  }

  await fs.copyFile(sourceFile, destinationFile);
};
