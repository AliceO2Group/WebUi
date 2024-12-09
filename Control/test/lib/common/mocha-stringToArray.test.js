const { stringToArray } = require('../../../lib/common/StringToArray');
const assert = require('assert');

describe('stringToArray', () => {
  it('converts comma-separated string to array', () => {
    const input = 'a,b,c';
    const expectedOutput = ['a', 'b', 'c'];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

  it('returns array as is', () => {
    const input = ['a', 'b', 'c'];
    const expectedOutput = ['a', 'b', 'c'];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

  it('returns empty array for empty string', () => {
    const input = '';
    const expectedOutput = [];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });

  it('returns empty array for empty array', () => {
    const input = [];
    const expectedOutput = [];
    assert.deepStrictEqual(stringToArray(input), expectedOutput);
  });
});