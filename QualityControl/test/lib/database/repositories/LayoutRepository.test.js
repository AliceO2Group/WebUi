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

import { ok, rejects, doesNotThrow } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { LayoutRepository } from '../../../../lib/database/repositories/LayoutRepository.js';
import { Op } from 'sequelize';
import { LogManager } from '@aliceo2/web-ui';

export const layoutRepositoryTestSuite = async () => {
  let layoutModelMock = null;
  let loggerMock = null;
  let repository = null;

  beforeEach(() => {
    layoutModelMock = {
      findByPk: sinon.stub(),
      findAll: sinon.stub(),
      findOne: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      destroy: sinon.stub(),
    };
    loggerMock = { errorMessage: sinon.stub() };

    if (!LogManager.getLogger.restore) {
      sinon.stub(LogManager, 'getLogger').returns(loggerMock);
    }

    repository = new LayoutRepository(layoutModelMock);
    repository._logger = loggerMock;
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('constructor', () => {
    test('should initialize with the correct model', () => {
      ok(repository._model === layoutModelMock);
    });
  });

  suite('findLayoutById', () => {
    test('should find a layout by its ID', async () => {
      const layoutId = 1;
      const layout = { id: layoutId, name: 'Test Layout' };
      layoutModelMock.findByPk.resolves(layout);

      const result = await repository.findLayoutById(layoutId);
      ok(result === layout);
      ok(layoutModelMock.findByPk.calledWith(layoutId));
    });

    test('should throw an error if the layout is not found', async () => {
      const layoutId = 1;
      layoutModelMock.findByPk.resolves(null);

      await rejects(
        async () => await repository.findLayoutById(layoutId),
        new Error('Layout not found'),
      );
    });

    test('should throw an error if search fails', async () => {
      const layoutId = 1;
      const error = new Error('Search failed');
      layoutModelMock.findByPk.rejects(error);

      await rejects(
        async () => await repository.findLayoutById(layoutId),
        error,
      );
    });
  });

  suite('findAllLayouts', () => {
    test('should find all layouts by filters', async () => {
      const filters = { name: 'Test Layout' };
      const layouts = [{ id: 1, name: 'Test Layout' }];
      layoutModelMock.findAll.resolves(layouts);

      const result = await repository.findAllLayouts(filters);
      ok(result === layouts);
      ok(layoutModelMock.findAll.calledWith({ where: { [Op.and]: [filters] } }));
    });

    test('should throw an error if search fails', async () => {
      const filters = { name: 'Test Layout' };
      const error = new Error('Search failed');
      layoutModelMock.findAll.rejects(error);

      await rejects(
        async () => await repository.findAllLayouts(filters),
        error,
      );
    });
  });

  suite('findLayoutByName', () => {
    test('should find a layout by its name', async () => {
      const layoutName = 'Test Layout';
      const layout = { id: 1, name: layoutName };
      layoutModelMock.findOne.resolves(layout);

      const result = await repository.findLayoutByName(layoutName);
      ok(result === layout);
      ok(layoutModelMock.findOne.calledWith({ where: { name: layoutName } }));
    });

    test('should throw an error if the layout is not found', async () => {
      const layoutName = 'Test Layout';
      layoutModelMock.findOne.resolves(null);
      await rejects(
        async () => await repository.findLayoutByName(layoutName),
        new Error(`Layout with name ${layoutName} not found`),
      );
    });

    test('should throw an error if search fails', async () => {
      const layoutName = 'Test Layout';
      const error = new Error('Search failed');
      layoutModelMock.findOne.rejects(error);

      await rejects(
        async () => await repository.findLayoutByName(layoutName),
        error,
      );
    });
  });

  suite('saveLayout', () => {
    test('should save a new layout', async () => {
      const layoutData = { name: 'New Layout' };
      const createdLayout = { id: 1, ...layoutData };
      layoutModelMock.create.resolves(createdLayout);

      const result = await repository.saveLayout(layoutData);
      ok(result === createdLayout);
      ok(layoutModelMock.create.calledWith(layoutData));
    });

    test('should throw an error if creation fails', async () => {
      const layoutData = { name: 'New Layout' };
      const error = new Error('Creation failed');
      layoutModelMock.create.rejects(error);

      await rejects(
        async () => await repository.saveLayout(layoutData),
        error,
      );
    });
  });

  suite('updateLayout', () => {
    test('should update a layout', async () => {
      const layoutId = 1;
      const updateData = { name: 'Updated Layout' };
      const affectedRows = 1;
      layoutModelMock.update.resolves([affectedRows]);

      const result = await repository.updateLayout(layoutId, updateData);
      ok(result === affectedRows);
      ok(layoutModelMock.update.calledWith(updateData, { where: { id: layoutId } }));
    });

    test('should throw an error if the layout is not found or no changes made', async () => {
      const layoutId = 1;
      const updateData = { name: 'Updated Layout' };
      layoutModelMock.update.resolves([0]);

      await rejects(
        async () => await repository.updateLayout(layoutId, updateData),
        new Error('Layout not found or no changes made'),
      );
    });

    test('should throw an error if update fails', async () => {
      const layoutId = 1;
      const updateData = { name: 'Updated Layout' };
      const error = new Error('Update failed');
      layoutModelMock.update.rejects(error);

      await rejects(
        async () => await repository.updateLayout(layoutId, updateData),
        error,
      );
    });
  });

  suite('deleteLayout', () => {
    test('should delete a layout', async () => {
      const layoutId = 1;
      layoutModelMock.destroy.resolves(1);

      await doesNotThrow(async () => {
        await repository.deleteLayout(layoutId);
      });
      ok(layoutModelMock.destroy.calledWith({ where: { id: layoutId } }));
    });

    test('should throw an error if the layout is not found', async () => {
      const layoutId = 1;
      layoutModelMock.destroy.resolves(0);

      await rejects(
        async () => await repository.deleteLayout(layoutId),
        new Error('Layout not found'),
      );
    });

    test('should throw an error if deletion fails', async () => {
      const layoutId = 1;
      const error = new Error('Deletion failed');
      layoutModelMock.destroy.rejects(error);

      await rejects(
        async () => await repository.deleteLayout(layoutId),
        error,
      );
    });
  });
};
