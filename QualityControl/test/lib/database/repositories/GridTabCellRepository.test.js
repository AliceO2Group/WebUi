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
import { stub, match } from 'sinon';
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
        findAll: stub(),
        findByPk: stub(),
        create: stub(),
        update: stub(),
        destroy: stub(),
        findOne: stub(),
        bulkCreate: stub(),
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
      const expectedCell = {
        id: 1,
        chart_id: chartId,
        tab: {

          name: 'Tab1', layout: { name: 'Layout1' },
        },
        chart: { object_name: 'Chart1', ignore_defaults: true, chartOptions: [] },
      };
      mockGridTabCellModel.findOne.resolves(expectedCell);
      const cell = await gridTabCellRepository.findObjectByChartId(chartId);
      deepStrictEqual(cell, expectedCell);
      ok(mockGridTabCellModel.findOne.calledOnceWith({ where: { chart_id: chartId }, include: match.array }));
    });

    test('should create a new grid tab cell', async () => {
      const newCellData = { tab_id: 'tab123', chart_id: 'chart123' };
      const createdCell = { id: 1, ...newCellData };
      mockGridTabCellModel.create.resolves(createdCell);

      const cell = await gridTabCellRepository.createGridTabCell(newCellData);
      deepStrictEqual(cell, createdCell);
      ok(mockGridTabCellModel.create.calledOnceWith(newCellData));
    });

    test('should update a grid tab cell by cell ID', async () => {
      const cellId = 1;
      const updateData = { some_field: 'newValue' };
      const updatedCount = 1;
      mockGridTabCellModel.update.resolves(updatedCount);

      const result = await gridTabCellRepository.updateGridTabCell(cellId, updateData);
      strictEqual(result, updatedCount);
      ok(mockGridTabCellModel.update.calledOnceWith(
        updateData,
        { where: { id: cellId } },
      ));
    });
  });
};
