/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { suite, test, beforeEach } from 'node:test';
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import sinon from 'sinon';
import { GridTabCellRepository } from '../../../../lib/database/repositories/GridTabCellRepository.js';

/**
 * Test suite for GridTabCellRepository
 */
export const gridTabCellRepositoryTestSuite = () => {
  suite('GridTabCellRepository', () => {
    let mockGridTabCellModel = null;
    let gridTabCellRepository = null;

    beforeEach(() => {
      mockGridTabCellModel = {
        name: 'GridTabCell',
        findAll: sinon.stub(),
        findByPk: sinon.stub(),
        create: sinon.stub(),
        update: sinon.stub(),
        destroy: sinon.stub(),
        findOne: sinon.stub(),
        bulkCreate: sinon.stub(),
      };
      gridTabCellRepository = new GridTabCellRepository(mockGridTabCellModel);
    });

    test('should create instance with grid tab cell model', () => {
      ok(gridTabCellRepository instanceof GridTabCellRepository);
      strictEqual(gridTabCellRepository.model, mockGridTabCellModel);
    });

    test('should inherit from BaseRepository', () => {
      ok(gridTabCellRepository.model);
    });

    test('should handle grid tab cell creation', async () => {
      const cellData = { tab_id: '1', x: 0, y: 0, w: 1, h: 1 };
      const createdCell = { id: '1', ...cellData };
      mockGridTabCellModel.create.resolves(createdCell);

      const result = await gridTabCellRepository.model.create(cellData);
      deepStrictEqual(result, createdCell);
      ok(mockGridTabCellModel.create.calledWith(cellData));
    });

    test('should handle grid tab cell retrieval by tab', async () => {
      const mockCells = [
        { id: '1', tab_id: '1', x: 0, y: 0, w: 1, h: 1 },
        { id: '2', tab_id: '1', x: 1, y: 0, w: 1, h: 1 },
      ];
      mockGridTabCellModel.findAll.resolves(mockCells);

      const result = await gridTabCellRepository.model.findAll({ where: { tab_id: '1' } });
      deepStrictEqual(result, mockCells);
      ok(mockGridTabCellModel.findAll.calledWith({ where: { tab_id: '1' } }));
    });

    test('should handle bulk grid tab cell creation', async () => {
      const cellsArray = [
        { tab_id: '1', x: 0, y: 0, w: 1, h: 1 },
        { tab_id: '1', x: 1, y: 0, w: 1, h: 1 },
      ];
      const createdCells = cellsArray.map((cell, i) => ({ id: String(i + 1), ...cell }));
      mockGridTabCellModel.bulkCreate.resolves(createdCells);

      const result = await gridTabCellRepository.model.bulkCreate(cellsArray);
      deepStrictEqual(result, createdCells);
      ok(mockGridTabCellModel.bulkCreate.calledWith(cellsArray));
    });

    test('should handle grid tab cell updates', async () => {
      const updateData = { x: 2, y: 2 };
      const updateResult = [1];
      mockGridTabCellModel.update.resolves(updateResult);

      const result = await gridTabCellRepository.model.update(updateData, { where: { id: '1' } });
      deepStrictEqual(result, updateResult);
      ok(mockGridTabCellModel.update.calledWith(updateData, { where: { id: '1' } }));
    });

    test('should handle grid tab cell deletion by tab', async () => {
      mockGridTabCellModel.destroy.resolves(2);

      const result = await gridTabCellRepository.model.destroy({ where: { tab_id: '1' } });
      strictEqual(result, 2);
      ok(mockGridTabCellModel.destroy.calledWith({ where: { tab_id: '1' } }));
    });
  });
};
