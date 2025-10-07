      SELECT DISTINCT l.id AS layout_id
      FROM layouts l
      JOIN tabs t ON t.layout_id = l.id
      JOIN grid_tab_cells gtc ON gtc.tab_id = t.id
      JOIN charts c ON c.id = gtc.chart_id
      WHERE c.object_name LIKE :objectPath
