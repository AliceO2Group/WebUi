# MySQL

First you need to import and configure the connector.

```js
const MySQL = require('@aliceo2/web-ui').MySQL;
const mySQL = new MySQL({host, user, password, database});
```

Then you can do some requests.

```js
mySQL.query('insert into layout (name, owner_id, owner_name, tabs) value (?,?,?,?)', [1, 2, 3, 4]);
  .then(result => console.log(result)) // {affectedRows: 1, insertId: 5, message: '', ...}
  .catch(err => console.error(err)); // can be ER_DUP_ENTRY in case of duplication

mySQL.query('select * from layout');
  .then(result => console.log(result)) // [{id: 1, name: 1, owner_id: 2, owner_name: 3, tabs: 4}, ...]
  .catch(err => console.error(err));

mySQL.query('delete from layout where id = 1')
  .then(result => console.log(result)) // {affectedRows: 1, insertId: 0, ...}
  .catch(err => console.error(err));

mySQL.query('update layout set name = ? where id = 4', ['hello'])
  .then(result => console.log(result)) // {affectedRows: 1, changedRows, 1, ...}
  .catch(err => console.error(err));
```
