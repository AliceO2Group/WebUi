/* eslint-disable jsdoc/require-param-description */
/* eslint-disable jsdoc/require-description */
// Tar can encode large and negative numbers using a leading byte of
// 0xff for negative, and 0x80 for positive.
// From https://github.com/isaacs/node-tar/blob/main/src/large-numbers.ts

/**
 * @param {number} num
 * @param {Buffer} buf
 * @returns {Buffer} number
 */
export const encode = (num, buf) => {
  if (!Number.isSafeInteger(num)) {
    // The number is so large that javascript cannot represent it with integer
    // precision.
    throw Error('cannot encode number outside of javascript safe integer range');
  } else if (num < 0) {
    encodeNegative(num, buf);
  } else {
    encodePositive(num, buf);
  }
  return buf;
};

/**
 * @param {number} num
 * @param {Buffer} buf
 * @returns {void}
 */
const encodePositive = (num, buf) => {
  buf[0] = 0x80;
  for (let i = buf.length; i > 1; i--) {
    buf[i - 1] = num & 0xff;
    num = Math.floor(num / 0x100);
  }
};

/**
 * @param {number} num
 * @param {Buffer} buf
 * @returns {void}
 */
const encodeNegative = (num, buf) => {
  buf[0] = 0xff;
  let flipped = false;
  num = num * -1;
  for (let i = buf.length; i > 1; i--) {
    const byte = num & 0xff;
    num = Math.floor(num / 0x100);
    if (flipped) {
      buf[i - 1] = onesComp(byte);
    } else if (byte === 0) {
      buf[i - 1] = 0;
    } else {
      flipped = true;
      buf[i - 1] = twosComp(byte);
    }
  }
};

/**
 * @param {Buffer} buf
 * @returns {number} number
 */
export const parse = (buf) => {
  const pre = buf[0];
  const value = pre === 0x80 ? pos(buf.subarray(1, buf.length))
    : pre === 0xff ? twos(buf)
      : null;
  if (value === null) {
    throw Error('invalid base256 encoding');
  }
  if (!Number.isSafeInteger(value)) {
    // The number is so large that javascript cannot represent it with integer
    // precision.
    throw Error('parsed number outside of javascript safe integer range');
  }
  return value;
};

/**
 * @param {Buffer} buf
 * @returns {number} number
 */
const twos = (buf) => {
  let len = buf.length;
  let sum = 0;
  let flipped = false;
  for (let i = len - 1; i > -1; i--) {
    let byte = Number(buf[i]);
    var f;
    if (flipped) {
      f = onesComp(byte);
    } else if (byte === 0) {
      f = byte;
    } else {
      flipped = true;
      f = twosComp(byte);
    }
    if (f !== 0) {
      sum -= f * Math.pow(256, len - i - 1);
    }
  }
  return sum;
};

/**
 * @param {Buffer} buf
 * @returns {number} number
 */
const pos = (buf) => {
  let len = buf.length;
  let sum = 0;
  for (let i = len - 1; i > -1; i--) {
    let byte = Number(buf[i]);
    if (byte !== 0) {
      sum += byte * Math.pow(256, len - i - 1);
    }
  }
  return sum;
};

/**
 * @param {number} byte
 * @returns {number} number
 */
const onesComp = (byte) => (0xff ^ byte) & 0xff;

/**
 * @param {number} byte
 * @returns {number} number
 */
const twosComp = (byte) => (0xff ^ byte) + 1 & 0xff;
