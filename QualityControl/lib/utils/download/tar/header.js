/* eslint-disable jsdoc/require-description */
// parse a 512-byte header block to a data object, or vice-versa
// encode returns `true` if a pax extended header is needed, because
// the data could not be faithfully encoded in a simple header.
// (Also, check header.needPax to see if it needs a pax header.)
// From https://github.com/isaacs/node-tar/blob/main/src/header.ts
import { posix as pathModule } from 'node:path';
import * as large from './large-numbers.js';

export class Header {
  cksumValid = false;

  needPax = false;

  nullBlock = false;

  block;

  path;

  mode;

  uid;

  gid;

  size;

  cksum;

  #type = 0;

  linkpath;

  uname;

  gname;

  devmaj = 0;

  devmin = 0;

  atime;

  ctime;

  mtime;

  charset;

  comment;

  /**
   * @param {Buffer | HeaderData} [data]
   */
  constructor(data) {
    if (Buffer.isBuffer(data)) {
    }
    else if (data) {
      this.#slurp(data);
    }
  }

  /**
   * @param {HeaderData} ex
   * @param {boolean} [gex=false]
   * @returns {void}
   */
  #slurp(ex, gex = false) {
    Object.assign(this, Object.fromEntries(Object.entries(ex).filter(([k, v]) => 
      // we slurp in everything except for the path attribute in
      // a global extended header, because that's weird. Also, any
      // null/undefined values are ignored.
      !(v === null ||
                v === undefined ||
                k === 'path' && gex ||
                k === 'linkpath' && gex ||
                k === 'global'))));
  }

  /**
   * @param {Buffer} [buf]
   * @param {number} [off=0]
   * @returns {boolean}
   */
  encode(buf, off = 0) {
    if (!buf) {
      buf = this.block = Buffer.alloc(512);
    }
    if (!(buf.length >= off + 512)) {
      throw new Error('need 512 bytes for header');
    }
    const prefixSize = this.ctime || this.atime ? 130 : 155;
    const split = splitPrefix(this.path || '', prefixSize);
    const path = split[0];
    const prefix = split[1];
    this.needPax = Boolean(split[2]);
    encString(buf, off, 100, path);
    encNumber(buf, off + 100, 8, this.mode);
    encNumber(buf, off + 108, 8, this.uid);
    encNumber(buf, off + 116, 8, this.gid);
    encNumber(buf, off + 124, 12, this.size);
    encDate(buf, off + 136, 12, this.mtime);
    // set type byte
    buf[off + 156] = this.#type;
    encString(buf, off + 157, 100, this.linkpath);
    buf.write('ustar\u000000', off + 257, 8);
    encString(buf, off + 265, 32, this.uname);
    encString(buf, off + 297, 32, this.gname);
    encNumber(buf, off + 329, 8, this.devmaj);
    encNumber(buf, off + 337, 8, this.devmin);
    encString(buf, off + 345, prefixSize, prefix);
    if (buf[off + 475] !== 0) {
      encString(buf, off + 345, 155, prefix);
    } else {
      encString(buf, off + 345, 130, prefix);
      encDate(buf, off + 476, 12, this.atime);
      encDate(buf, off + 488, 12, this.ctime);
    }
    let sum = 8 * 0x20;
    for (let i = off; i < off + 148; i++) {
      sum += buf[i];
    }
    for (let i = off + 156; i < off + 512; i++) {
      sum += buf[i];
    }
    this.cksum = sum;
    encNumber(buf, off + 148, 8, this.cksum);
    this.cksumValid = true;
    return this.needPax;
  }
}

// to handle prefix, whole path? only filename? depends on size.
/**
 * @param {string} p
 * @param {number} prefixSize
 * @returns {[string, string, boolean]}
 */
const splitPrefix = (p, prefixSize) => {
  const pathSize = 100;
  let pp = p;
  let prefix = '';
  let ret = undefined;
  const root = pathModule.parse(p).root || '.';
  if (Buffer.byteLength(pp) < pathSize) {
    ret = [pp, prefix, false];
  } else {
    // first set prefix to the dir, and path to the base
    prefix = pathModule.dirname(pp);
    pp = pathModule.basename(pp);
    do {
      if (Buffer.byteLength(pp) <= pathSize &&
                Buffer.byteLength(prefix) <= prefixSize) {
        // both fit!
        ret = [pp, prefix, false];
      } else if (Buffer.byteLength(pp) > pathSize &&
                Buffer.byteLength(prefix) <= prefixSize) {
        // prefix fits in prefix, but path doesn't fit in path
        ret = [pp.slice(0, pathSize - 1), prefix, true];
      } else {
        // make path take a bit from prefix
        pp = pathModule.join(pathModule.basename(prefix), pp);
        prefix = pathModule.dirname(prefix);
      }
    } while (prefix !== root && ret === undefined);
    // at this point, found no resolution, just truncate
    if (!ret) {
      ret = [p.slice(0, pathSize - 1), '', true];
    }
  }
  return ret;
};
// the maximum encodable as a null-terminated octal, by field size
const MAXNUM = {
  12: 0o77777777777,
  8: 0o7777777,
};

/**
 * @param {Buffer} buf
 * @param {number} off
 * @param {12 | 8} size
 * @param {number} [num]
 * @returns {boolean}
 */
const encNumber = (buf, off, size, num) => num === undefined ? false
  : num > MAXNUM[size] || num < 0 ?
    (large.encode(num, buf.subarray(off, off + size)), true)
    : (encSmallNumber(buf, off, size, num), false);

/**
 * @param {Buffer} buf
 * @param {number} off
 * @param {number} size
 * @param {number} num
 * @returns {number}
 */
const encSmallNumber = (buf, off, size, num) => buf.write(octalString(num, size), off, size, 'ascii');

/**
 * @param {number} num
 * @param {number} size
 * @returns {string}
 */
const octalString = (num, size) => padOctal(Math.floor(num).toString(8), size);

/**
 * @param {string} str
 * @param {number} size
 * @returns {string}
 */
const padOctal = (str, size) => `${str.length === size - 1 ?
  str
  : `${new Array(size - str.length - 1).join('0') + str} `}\0`;

/**
 * @param {Buffer} buf
 * @param {number} off
 * @param {8 | 12} size
 * @param {Date} [date]
 * @returns {boolean}
 */
const encDate = (buf, off, size, date) => date === undefined ? false : encNumber(buf, off, size, date.getTime() / 1000);

// enough to fill the longest string we've got
const NULLS = new Array(156).join('\0');

// pad with nulls, return true if it's longer or non-ascii
/**
 * @param {Buffer} buf
 * @param {number} off
 * @param {number} size
 * @param {string} [str]
 * @returns {boolean}
 */
const encString = (buf, off, size, str) => str === undefined ? false : (buf.write(str + NULLS, off, size, 'utf8'),
str.length !== Buffer.byteLength(str) || str.length > size);

/**
 * @typedef {Object} HeaderData
 * @property {string} [path]
 * @property {number} [mode]
 * @property {number} [uid]
 * @property {number} [gid]
 * @property {number} [size]
 * @property {number} [cksum]
 * @property {number | 0} [type]
 * @property {string} [linkpath]
 * @property {string} [uname]
 * @property {string} [gname]
 * @property {number} [devmaj]
 * @property {number} [devmin]
 * @property {Date} [atime]
 * @property {Date} [ctime]
 * @property {Date} [mtime]
 * @property {string} [charset]
 * @property {string} [comment]
 * @property {number} [dev]
 * @property {number} [ino]
 * @property {number} [nlink]
 */
