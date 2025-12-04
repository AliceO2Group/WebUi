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

import assert from 'assert';
import { buildTree } from '~/utils/configuration-tree-builder'; // Upewnij się, że ścieżka jest OK
import { CONFIGURATION_KEY_PREFIX } from '~/config';

describe('Configuration Tree Builder', function () {
  const createPath = (suffix: string) => {
    const cleanSuffix = suffix.startsWith('/') ? suffix.slice(1) : suffix;
    const separator = CONFIGURATION_KEY_PREFIX.endsWith('/') ? '' : '/';
    return `${CONFIGURATION_KEY_PREFIX}${separator}${cleanSuffix}`;
  };

  it('should return an empty object when input paths are empty', function () {
    const result = buildTree([]);
    assert.deepStrictEqual(result, {});
  });

  it('should create a simple tree with one file at root level', function () {
    const fileName = 'common';
    const fullPath = createPath(fileName);

    const result = buildTree([fullPath]);

    assert.ok(result[fileName], 'Root key should exist');

    assert.strictEqual(result[fileName].name, fileName);
    assert.strictEqual(result[fileName].isFile, true);
    assert.strictEqual(result[fileName].fullPath, fullPath);
    assert.deepStrictEqual(result[fileName].children, {});
  });

  it('should create a nested structure (folder -> file)', function () {
    const path = createPath('components/qc');

    const result = buildTree([path]);

    assert.ok(result['components']);
    assert.strictEqual(result['components'].isFile, false);
    assert.strictEqual(result['components'].name, 'components');

    const child = result['components'].children['qc'];
    assert.ok(child, 'Child node should exist');
    assert.strictEqual(child.isFile, true);
    assert.strictEqual(child.name, 'qc');
    assert.strictEqual(child.fullPath, path);
  });

  it('should group siblings in the same folder', function () {
    const path1 = createPath('components/qc');
    const path2 = createPath('components/trd');

    const result = buildTree([path1, path2]);

    assert.strictEqual(Object.keys(result).length, 1);
    assert.ok(result['components']);

    const { children } = result['components'];
    assert.strictEqual(Object.keys(children).length, 2);

    assert.ok(children['qc']);
    assert.ok(children['trd']);

    assert.strictEqual(children['qc'].isFile, true);
    assert.strictEqual(children['trd'].isFile, true);
  });

  it('should handle deeply nested paths correctly', function () {
    const path = createPath('level1/level2/level3/file');

    const result = buildTree([path]);

    assert.ok(result['level1']);
    assert.ok(result['level1'].children['level2']);
    assert.ok(result['level1'].children['level2'].children['level3']);
    const fileNode = result['level1'].children['level2'].children['level3'].children['file'];

    assert.ok(fileNode);
    assert.strictEqual(fileNode.isFile, true);
    assert.strictEqual(fileNode.fullPath, path);
  });

  it('should handle mixed files and folders at the same level', function () {
    const pathA = createPath('folder/fileA');
    const pathB = createPath('folder/subfolder/fileB');

    const result = buildTree([pathA, pathB]);
    const rootFolder = result['folder'];

    assert.strictEqual(rootFolder.children['fileA'].isFile, true);
    assert.strictEqual(rootFolder.children['subfolder'].isFile, false);
    assert.ok(rootFolder.children['subfolder'].children['fileB']);
  });
});
