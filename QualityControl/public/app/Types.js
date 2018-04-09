/*
Javascript is weakly-typed.
Properties of an object can be checked
*/

export function assertLayouts(array) {
  assertArray(array);
  array.forEach((item) => assertLayout(item));
  return array;
}

export function assertLayout(obj) {
  assertString(obj.id);
  assertString(obj.name);
  assertNumber(obj.owner_id);
  assertString(obj.owner_name);
  assertArray(obj.tabs);
  return obj;
}

export function assertTabs(array) {
  assertArray(array);
  array.forEach((item) => assertTab(item));
  return array;
}

export function assertTab(obj) {
  assertString(obj.id);
  assertString(obj.name);
  assertArray(obj.objects);
  return obj;
}

export function assertTabObject(obj) {
  assertString(obj.id);
  assertString(obj.name);
  assertArray(obj.options);
  assertNumber(obj.x);
  assertNumber(obj.y);
  assertNumber(obj.h);
  assertNumber(obj.w);
  return obj;
}

// Primive types

export function assertNumber(value) {
  if (typeof value !== 'number') throw new TypeError(`value must be a number, found ${typeof value}`);
  return value;
}

export function assertString(value) {
  if (typeof value !== 'string') throw new TypeError(`value must be a string, found ${typeof value}`);
  return value;
}

export function assertArray(value) {
  if (!Array.isArray(value)) throw new TypeError(`value must be an array, found ${typeof value}`);
  return value;
}

