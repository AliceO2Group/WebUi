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

import { ok, doesNotThrow, rejects } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { GridTabCellRepository } from '../../../../lib/database/repositories/GridTabCellRepository.js';
import { LogManager } from '@aliceo2/web-ui';
import { Op } from 'sequelize';

export const gridTabCellRepositoryTestSuite = async () => {
  let gridTabCellModelMock = null;
  let loggerMock = null;
  let repository = null;

  beforeEach(() => {
    gridTabCellModelMock = { findAll: sinon.stub(), create: sinon.stub(), destroy: sinon.stub(), update: sinon.stub() };
    loggerMock = { errorMessage: sinon.stub() };

    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }

    repository = new GridTabCellRepository(gridTabCellModelMock);
    repository._logger = loggerMock;
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('constructor', () => {
    test('should initialize with the correct model', () => {
      ok(repository._model === gridTabCellModelMock);
    });
  });

  suite('findByTabId', () => {
    test('should find grid tab cells by tab ID', async () => {
      const tabId = 1;
      const gridTabCells = [{ id: 1, tab_id: tabId, content: 'Cell 1' }];
      gridTabCellModelMock.findAll.resolves(gridTabCells);

      const result = await repository.findByTabId(tabId);
      ok(result === gridTabCells);
      ok(gridTabCellModelMock.findAll.calledWith({ where: { [Op.and]: [{ tab_id: tabId }] } }));
    });

    test('should log and throw an error if search fails', async () => {
      const tabId = 1;
      const error = new Error('Search failed');
      gridTabCellModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findByTabId(tabId),
        error,
      );
      ok(loggerMock.errorMessage.calledWith(`Error finding grid tab cells by tab ID: ${error.message}`));
    });
  });

  suite('findByChartId', () => {
    test('should find grid tab cells by chart ID', async () => {
      const chartId = 1;
      const gridTabCells = [{ id: 1, chart_id: chartId, content: 'Cell 1' }];
      gridTabCellModelMock.findAll.resolves(gridTabCells);

      const result = await repository.findByChartId(chartId);
      ok(result === gridTabCells);
      ok(gridTabCellModelMock.findAll.calledWith({ where: { [Op.and]: [{ chart_id: chartId }] } }));
    });

    test('should log and throw an error if search fails', async () => {
      const chartId = 1;
      const error = new Error('Search failed');
      gridTabCellModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findByChartId(chartId),
        error,
      );
      ok(loggerMock.errorMessage.calledWith(`Error finding grid tab cells by chart ID: ${error.message}`));
    });
  });

  suite('createGridTabCell', () => {
    test('should create a new grid tab cell', async () => {
      const newGridTabCell = { chart_id: 1, tab_id: 2, content: 'New Cell' };
      const createdGridTabCell = { id: 1, ...newGridTabCell };
      gridTabCellModelMock.create.resolves(createdGridTabCell);

      const result = await repository.createGridTabCell(newGridTabCell);
      ok(result === createdGridTabCell);
      ok(gridTabCellModelMock.create.calledWith(newGridTabCell));
    });

    test('should log and throw an error if creation fails', async () => {
      const newGridTabCell = { chart_id: 1, tab_id: 2, content: 'New Cell' };
      const error = new Error('Creation failed');
      gridTabCellModelMock.create.rejects(error);

      await rejects(
        async () => await repository.createGridTabCell(newGridTabCell),
        error,
      );
      ok(loggerMock.errorMessage.calledWith(`Error creating grid tab cell: ${error.message}`));
    });
  });

  suite('deleteGridTabCell', () => {
    test('should delete a grid tab cell', async () => {
      const chartId = 1;
      const tabId = 2;
      gridTabCellModelMock.destroy.resolves(1);

      await doesNotThrow(async () => {
        await repository.deleteGridTabCell(chartId, tabId);
      });
      ok(gridTabCellModelMock.destroy.calledWith({ where: { chart_id: chartId, tab_id: tabId } }));
    });

    test('should log and throw an error if the grid tab cell is not found', async () => {
      const chartId = 1;
      const tabId = 2;
      gridTabCellModelMock.destroy.resolves(0);

      await rejects(
        async () => await repository.deleteGridTabCell(chartId, tabId),
        new Error('Grid tab cell not found'),
      );
    });

    test('should log and throw an error if deletion fails', async () => {
      const chartId = 1;
      const tabId = 2;
      const error = new Error('Deletion failed');
      gridTabCellModelMock.destroy.rejects(error);

      await rejects(
        async () => await repository.deleteGridTabCell(chartId, tabId),
        error,
      );
    });
  });

  suite('updateGridTabCell', () => {
    test('should update a grid tab cell', async () => {
      const chartId = 1;
      const newGridTabCell = { tab_id: 2, content: 'Updated Cell' };
      const affectedRows = 1;
      gridTabCellModelMock.update.resolves([affectedRows]);

      const result = await repository.updateGridTabCell(chartId, newGridTabCell);
      ok(result === affectedRows);
      ok(gridTabCellModelMock.update
        .calledWith(newGridTabCell, { where: { id: { chart_id: chartId, tab_id: newGridTabCell.tab_id } } }));
    });

    test('should log and throw an error if the grid tab cell is not found or no changes made', async () => {
      const chartId = 1;
      const newGridTabCell = { tab_id: 2, content: 'Updated Cell' };
      gridTabCellModelMock.update.resolves([0]);

      await rejects(
        async () => await repository.updateGridTabCell(chartId, newGridTabCell),
        new Error('Grid tab cell not found or no changes made'),
      );
    });

    test('should log and throw an error if update fails', async () => {
      const chartId = 1;
      const newGridTabCell = { tab_id: 2, content: 'Updated Cell' };
      const error = new Error('Update failed');
      gridTabCellModelMock.update.rejects(error);

      await rejects(
        async () => await repository.updateGridTabCell(chartId, newGridTabCell),
        error,
      );
      ok(loggerMock.errorMessage.calledWith(`Error updating grid tab cell: ${error.message}`));
    });
  });
};
