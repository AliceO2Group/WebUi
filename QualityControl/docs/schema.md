### Storage data structure

User preferences stored inside MariaDB.

Tables: layout, favorite

*tab-object*
- id
- tab_id
- object_name
- x
- y
- w
- h
- logx
- logy
- color

*tab*
- id
- layout_id
- name
- objects: JSON<list of tab-objects>

*layout*
- id
- name
- owner_id
- owner_name
- tabs: JSON<list of tabs>

*favorite*
- id
- owner_id
- layout_id
