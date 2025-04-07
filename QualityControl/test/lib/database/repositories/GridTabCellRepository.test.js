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

export const gridTabCellRepositoryTestSuite = async () => {
  let gridTabCellModelMock = null;
  let repository = null;
  let loggerMock = null;

  beforeEach(() => {
    // Mock de logger
    loggerMock = {
      errorMessage: sinon.stub(),
    };
    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }

    // Mock de modelo
    gridTabCellModelMock = {
      create: sinon.stub(),
      findAll: sinon.stub(),
      findOne: sinon.stub(),
      destroy: sinon.stub(),
      update: sinon.stub(),
    };

    // Inicializa el repositorio
    repository = new GridTabCellRepository(gridTabCellModelMock);
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('findByTabId', () => {
    test('should find grid tab cells by tab ID', async () => {
      const tabId = 1;
      const gridTabCells = [{ id: 1, tab_id: tabId }];
      gridTabCellModelMock.findAll.resolves(gridTabCells);

      const result = await repository.findByTabId(tabId);
      ok(result === gridTabCells);
      ok(gridTabCellModelMock.findAll.calledWith({ where: { tab_id: tabId } }));
    });

    test('should throw an error if search fails', async () => {
      const tabId = 1;
      const error = new Error('Search failed');
      gridTabCellModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findByTabId(tabId),
        error,
      );
    });
  });

  suite('findByChartId', () => {
    test('should find grid tab cells by chart ID', async () => {
      const chartId = 1;
      const gridTabCells = [{ id: 1, chart_id: chartId }];
      gridTabCellModelMock.findAll.resolves(gridTabCells);

      const result = await repository.findByChartId(chartId);
      ok(result === gridTabCells);
      ok(gridTabCellModelMock.findAll.calledWith({ where: { chart_id: chartId } }));
    });

    test('should throw an error if search fails', async () => {
      const chartId = 1;
      const error = new Error('Search failed');
      gridTabCellModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findByChartId(chartId),
        error,
      );
    });
  });

  suite('createGridTabCell', () => {
    test('should create a new grid tab cell', async () => {
      const newGridTabCell = { chart_id: 1, tab_id: 1 };
      const createdGridTabCell = { id: 1, ...newGridTabCell };
      gridTabCellModelMock.create.resolves(createdGridTabCell);

      const result = await repository.createGridTabCell(newGridTabCell);
      ok(result === createdGridTabCell);
      ok(gridTabCellModelMock.create.calledWith(newGridTabCell));
    });

    test('should throw an error if creation fails', async () => {
      const newGridTabCell = { chart_id: 1, tab_id: 1 };
      const error = new Error('Creation failed');
      gridTabCellModelMock.create.rejects(error);

      await rejects(
        async () => await repository.createGridTabCell(newGridTabCell),
        error,
      );
    });
  });

  suite('deleteGridTabCell', () => {
    test('should delete a grid tab cell', async () => {
      const chartId = 1;
      const tabId = 1;
      gridTabCellModelMock.destroy.resolves(1);

      await doesNotThrow(async () => {
        await repository.deleteGridTabCell(chartId, tabId);
      });
      ok(gridTabCellModelMock.destroy.calledWith({ where: { chart_id: chartId, tab_id: tabId } }));
    });

    test('should throw an error if the grid tab cell is not found', async () => {
      const chartId = 1;
      const tabId = 1;
      gridTabCellModelMock.destroy.resolves(0);

      await rejects(
        async () => await repository.deleteGridTabCell(chartId, tabId),
        new Error('Grid tab cell not found'),
      );
    });

    test('should throw an error if deletion fails', async () => {
      const chartId = 1;
      const tabId = 1;
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
      const gridTabCellIdentificator = { chart_id: 1, tab_id: 1 };
      const newGridTabCell = { name: 'Updated Cell' };
      const affectedRows = 1;
      gridTabCellModelMock.update.resolves([affectedRows]);

      const result = await repository.updateGridTabCell(gridTabCellIdentificator, newGridTabCell);
      ok(result === affectedRows);
      ok(gridTabCellModelMock.update.calledWith(newGridTabCell, { where: { chart_id: 1, tab_id: 1 } }));
    });

    test('should throw an error if grid tab cell not found or no changes made', async () => {
      const gridTabCellIdentificator = { chart_id: 1, tab_id: 1 };
      const newGridTabCell = { name: 'Updated Cell' };
      gridTabCellModelMock.update.resolves([0]);

      await rejects(
        async () => await repository.updateGridTabCell(gridTabCellIdentificator, newGridTabCell),
        new Error('Grid tab cell not found or no changes made'),
      );
    });

    test('should throw an error if update fails', async () => {
      const gridTabCellIdentificator = { chart_id: 1, tab_id: 1 };
      const newGridTabCell = { name: 'Updated Cell' };
      const error = new Error('Update failed');
      gridTabCellModelMock.update.rejects(error);

      await rejects(
        async () => await repository.updateGridTabCell(gridTabCellIdentificator, newGridTabCell),
        error,
      );
    });
  });

  suite('findObjectByChartId', () => {
    test('should find object by chart ID', async () => {
      const chartId = 1;
      const gridTabCellObject = { chart_id: chartId, tab: { name: 'Tab1' }, chart: { object_name: 'Chart1' } };
      gridTabCellModelMock.findOne.resolves(gridTabCellObject);

      const result = await repository.findObjectByChartId(chartId);
      ok(result === gridTabCellObject);
    });

    test('should throw an error if the object cannot be found', async () => {
      const chartId = 1;
      gridTabCellModelMock.findOne.resolves(null);

      await rejects(
        async () => await repository.findObjectByChartId(chartId),
        new Error('Grid tab cell not found'),
      );
    });
  });
};
