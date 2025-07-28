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

/**
 * @description Serializes Json formatted request into binary payload with specific endpoint
 * @param url - The endpoint URL to which the request is made
 * @param options - Request options, such as headers or body
 * @return {ArrayBuffer} - The serialized binary payload containing the URL and options
 */
export const serializeRequest = (url: string, options: any): ArrayBuffer => {
  const encoder = new TextEncoder();
  const contentTypeBytes = encoder.encode("application/json");

  // build JSON data
  const jsonData = {
    url: url,
    options: options,
  };

  const jsonString = JSON.stringify(jsonData);
  const jsonBytes = encoder.encode(jsonString);

  // Buffer following structure:
  //    1 byte -> type length
  //    N bytes -> types
  //    rest -> JSON data
  const buffer = new Uint8Array(1 + contentTypeBytes.length + jsonBytes.length);

  buffer[0] = contentTypeBytes.length;
  buffer.set(contentTypeBytes, 1);
  buffer.set(jsonBytes, 1 + contentTypeBytes.length);

  return buffer.buffer;
};

/**
 * @description Deserializes binary payload to Json formated request
 * @param payload - The binary payload to deserialize
 * @return {any} - The deserialized request object containing the URL and options
 */
export const deserializeRequest = (payload: ArrayBuffer): any => {
  const view = new Uint8Array(payload);
  const decoder = new TextDecoder();

  const contentTypeLength = view[0];
  const contentTypeBytes = view.slice(1, 1 + contentTypeLength);
  const contentType = decoder.decode(contentTypeBytes);

  const dataBytes = view.slice(1 + contentTypeLength);

  // deserialization of JSON content
  if (contentType === "application/json") {
    return JSON.parse(decoder.decode(dataBytes));
  } else {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
};
