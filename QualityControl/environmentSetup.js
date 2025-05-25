import { LogManager } from '@aliceo2/web-ui';
import { fileURLToPath } from 'url';
import { envIndexFiles } from './environments.js';
import { join, dirname } from 'path';
import fs from 'fs';

/**
 * Initializes environment-specific JavaScript file and logging configuration.
 * - Copies the appropriate environment-specific index.js file (dev/prod/test) to index.js
 * - Sets up test environment mocks when in test mode
 * @async
 * @function initializeEnvironment
 * @returns {Promise<Logger>} logger instance
 * @description
 * This function performs environment setup tasks:
 * 1. Determines correct environment-specific JS file based on NODE_ENV
 * 2. Copies the environment-specific file to index.js in public directory
 * 3. Initializes test mocks when in test environment
 * 4. Returns a configured logger instance
 */
export default async function () {
  const { NODE_ENV, npm_config_log_label } = process.env;
  const logger = LogManager.getLogger(`${npm_config_log_label ?? 'qcg'}/index`);

  const __dirname = dirname(fileURLToPath(import.meta.url));

  const envIndexFile = envIndexFiles[NODE_ENV];

  const publicDir = join(__dirname, 'public');
  const sourceJsPath =
    join(publicDir, envIndexFiles[NODE_ENV]); // These files will have different properties per environment
  const targetJsPath = join(publicDir, 'index.js'); // the former file will be overwrite this file.

  fs.copyFileSync(sourceJsPath, targetJsPath);
  logger.infoMessage(`Using ${envIndexFile} as index.js for environment: ${process.env.NODE_ENV}`);

  if (NODE_ENV === 'test') {
    // Initialize nock for CCDB and Bookkeeping only if we are in test environment
    const { initializeNockForCcdb } = await import('./test/setup/testSetupForCcdb.js');
    const { initializeNockForBkp } = await import('./test/setup/testSetupForBkp.js');

    initializeNockForCcdb();
    initializeNockForBkp();
  }

  return logger;
}
