import fs from 'fs';
import { User, Layout, Tab, Chart, GridTabCell } from './models';

// IMPORTANT: Specify the path to the JSON file to be migrated here
const JSON_FILE_PATH = '';

const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
const data = JSON.parse(rawData);

/**
 * Migrates data from JSON file to the database.
 */
async function migrateJsonToDB() {
  for (const user of data.users) {
    await User.create({
      id: user.id,
      username: user.username,
      name: user.name,
    });
  }

  for (const layout of data.layouts) {
    await Layout.create({
      id: layout.id,
      name: layout.name,
      description: layout.description,
      display_timestamp: layout.displayTimestamp,
      auto_tab_change_interval: layout.autoTabChange,
      owner_username: data.users.find((u) => u.id === layout.owner_id)?.username,
    });

    for (const tab of layout.tabs) {
      await Tab.create({
        id: tab.id,
        name: tab.name,
        layout_id: layout.id,
        column_count: tab.columns,
      });

      for (const obj of tab.objects) {
        await Chart.create({
          id: obj.id,
          object_name: obj.name,
          ignore_defaults: obj.ignoreDefaults,
        });

        await GridTabCell.create({
          chart_id: obj.id,
          row: obj.y,
          col: obj.x,
          tab_id: tab.id,
          row_span: obj.h,
          col_span: obj.w,
        });
      }
    }
  }
}

migrateJsonToDB()
  .then(() => {
    console.log('✅ Successfully migrated data to the database');
  }).catch((error) => {
    console.error('❌ Error migrating data:', error);
  });
