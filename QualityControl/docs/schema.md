### Storage data structure

User preferences stored inside MariaDB.

Tables: layout, favorite

*tab-object*
- id
- name
- x
- y
- w
- h
- options

*tab*
- id
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
