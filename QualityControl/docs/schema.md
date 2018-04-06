### Storage data structure

User preferences stored inside MySQL.

Tables: layout, data_AGENTNAME

*data_AGENTNAME*
- object_name
- updatetime
- data
- size
- run
- fill

*layout*
- id
- name
- owner_id
- owner_name
- tabs: JSON<list of tabs>

*object*
- name (AGENTNAME/object_name)
- quality

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
