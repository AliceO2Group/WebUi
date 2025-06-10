/**
 * @description Serializes Json formatted request into binary payload with specific endpoint
 * @param url - The endpoint URL to which the request is made
 * @param options - Optional request options, such as headers or body
 * @return {ArrayBuffer} - The serialized binary payload containing the URL and options
 */
export const serializeRequest = (url: string, options?: any) => {
  const encoder = new TextEncoder();
  const contentTypeBytes = encoder.encode("application/json");

  // build JSON data
  const jsonData = options
    ? {
        url: url,
        options: options,
      }
    : {
        url: url,
      };

  // encode JSON
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
export const deserializeRequest = (payload: any) => {
  const view = new Uint8Array(payload);
  const decoder = new TextDecoder();

  const contentTypeLength = view[0];
  const contentTypeBytes = view.slice(1, 1 + contentTypeLength);
  const contentType = decoder.decode(contentTypeBytes);

  const dataBytes = view.slice(1 + contentTypeLength);
  let data;

  // deserialization based on content type
  switch (contentType) {
    case "application/json":
      data = JSON.parse(decoder.decode(dataBytes));
      break;
    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }

  return data;
};
