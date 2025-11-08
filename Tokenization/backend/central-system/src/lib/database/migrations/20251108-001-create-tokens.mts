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

import type { QueryInterface } from 'sequelize';

/** Umzug migration: create `tokens` table */
export async function up(
  q: QueryInterface,
  Sequelize: typeof import('sequelize')
) {
  await q.createTable('tokens', {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    audience: { type: Sequelize.STRING(255), allowNull: false },
    subject: { type: Sequelize.STRING(255), allowNull: false },
    token_object: { type: Sequelize.JSON, allowNull: false },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
      ),
    },
  });

  await q.addIndex('tokens', ['audience'], { name: 'tokens_audience_idx' });
  await q.addIndex('tokens', ['subject'], { name: 'tokens_subject_idx' });
  await q.addIndex('tokens', ['created_at'], { name: 'tokens_created_at_idx' });
}

export async function down(q: QueryInterface) {
  try {
    await q.removeIndex('tokens', 'tokens_created_at_idx');
  } catch {}
  try {
    await q.removeIndex('tokens', 'tokens_subject_idx');
  } catch {}
  try {
    await q.removeIndex('tokens', 'tokens_audience_idx');
  } catch {}
  await q.dropTable('tokens');
}
