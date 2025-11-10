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
import { LogManager } from '@aliceo2/web-ui';
import { Header } from './header.js';
import { Buffer } from 'node:buffer';

const logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/download-tar`);

/**
 * Create a Tarball File,
 * @param {Array<File>} files - Files to add to Tarball.
 * @param {string} tarName - Tarball file name.
 * @returns {Promise<File>} - Tarball file
 */
export async function createTar(files, tarName) {
  // total size of our Tarball, always has two empty 512 blocks...
  let totalSizeByte = 1024;
  for (const file of files) {
    const remainder = file.size % 512;
    let bytesToPad = 0;
    if (remainder !== 0) {
      bytesToPad = 512 - remainder;
    }
    // header + file + padding
    totalSizeByte += 512 + file.size + bytesToPad;
  }
  const buf = Buffer.alloc(totalSizeByte);
  let offset = 0;
  for (const file of files) {
    const remainder = file.size % 512;
    let bytesToPad = 0;
    if (remainder !== 0) {
      bytesToPad = 512 - remainder;
    }
    logger.debugMessage(`Remainder: ${remainder}`);
    logger.debugMessage(`Bytes to padd: ${bytesToPad}`);
    const header = new Header({
      path: file.name,
      size: file.size,
      mtime: new Date(file.lastModified),
      mode: 0o00755,
    });
    header.encode(buf, offset);
    offset += 512;
    // Write Root file to tar.
    offset = await writeFile(file, buf, offset);
    // Write padding
    offset = padBlock(buf, bytesToPad, offset);
  }
  // fill in the last two empty blocks...
  buf.fill('', offset);
  // We assume it will be Gzipped later....
  // return new File([buf.buffer], `${tarName}.tar`)
  return new File([buf.buffer], `${tarName}.tar.gz`);
}

/**
 * add file to tarball
 * @param {File} file - file to add.
 * @param {Buffer} buf - buffer to add to.
 * @param {number} offset - current offset of buffer.
 * @returns {Promise<number>} offset.
 */
async function writeFile(file, buf, offset) {
  // preserves the files structure.
  const ab = await file.arrayBuffer();
  const fileBuf = Buffer.from(ab);
  fileBuf.copy(buf, offset);
  return offset + fileBuf.length;
}

/**
 * pad the block
 * @param {Buffer} buf - buffer to pad.
 * @param {number} bytesToPad - amount of bytes to pad buffer with.
 * @param {number} offset - current offset.
 * @returns {number} offset.
 */
function padBlock(buf, bytesToPad, offset) {
  // No need to add padding
  if (bytesToPad == 0) {
    return offset;
  }
  logger.debugMessage(`bytes to pad = ${bytesToPad}`);
  logger.debugMessage(`padding zeros from ${offset} to ${offset + bytesToPad}.`);
  // fill buffer with zero's
  buf.fill('', offset, offset + bytesToPad, 'utf-8');
  return offset + bytesToPad;
}
