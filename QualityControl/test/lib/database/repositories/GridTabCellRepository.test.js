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

    test('should find grid tab cells by tab ID', async () => {
      const tabId = 'tab123';
      const expectedCells = [{ id: 1, tab_id: tabId }, { id: 2, tab_id: tabId }];
      mockGridTabCellModel.findAll.resolves(expectedCells);

      const cells = await gridTabCellRepository.findByTabId(tabId);

      deepStrictEqual(cells, expectedCells);
      ok(mockGridTabCellModel.findAll.calledOnceWith({ where: { tab_id: tabId } }));
    });

    test('should find object by chart ID', async () => {
      const chartId = 'chart123';
      const expectedCells = [{ id: 1, chart_id: chartId }, { id: 2, chart_id: chartId }];
      mockGridTabCellModel.findAll.resolves(expectedCells);

      const cells = await gridTabCellRepository.findObjectByChartId(chartId);

      deepStrictEqual(cells, expectedCells);
      ok(mockGridTabCellModel.findAll.calledOnce);
      const [callArgs] = mockGridTabCellModel.findAll.getCall(0).args;
      strictEqual(callArgs.where.chart_id, chartId);
      ok(Array.isArray(callArgs.include));
      const tabInclude = callArgs.include.find((inc) => inc.association === 'tab');
      ok(tabInclude);
      const chartInclude = callArgs.include.find((inc) => inc.association === 'chart');
      ok(chartInclude);
      const chartOptionsInclude = chartInclude.include.find((inc) => inc.association === 'chartOptions');
      ok(chartOptionsInclude);
      const optionInclude = chartOptionsInclude.include.find((inc) => inc.association === 'option');
      ok(optionInclude);
    });

    test('should create a new grid tab cell', async () => {
      const newCellData = { tab_id: 'tab123', chart_id: 'chart123' };
      const createdCell = { id: 1, ...newCellData };
      mockGridTabCellModel.create.resolves(createdCell);

      const cell = await gridTabCellRepository.createGridTabCell(newCellData);
      deepStrictEqual(cell, createdCell);
      ok(mockGridTabCellModel.create.calledOnceWith(newCellData));
    });

    test('should update a grid tab cell by chart ID and tab ID', async () => {
      const chartId = 'chart123';
      const tabId = 'tab123';
      const updateData = { some_field: 'newValue' };
      const updatedCount = 1;
      mockGridTabCellModel.update.resolves([updatedCount]);

      const result = await gridTabCellRepository.updateGridTabCell({ chartId, tabId }, updateData);
      strictEqual(result, updatedCount);
      ok(mockGridTabCellModel.update.calledOnceWith(
        updateData,
        { where: { chart_id: chartId, tab_id: tabId } },
      ));
    });
  });
};
