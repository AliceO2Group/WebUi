# MySQL client
Manages pool of MySQL connections.

#### Instance
Import the module
```js
require('@aliceo2/web-ui').MySQL
```

Create an instance
```js
MySQL({HOST, USER, PASSWORD, DATABASE});
```

Where:
 - `HOST` - database hostname
 - `USER` - database username
 - `PASSWORD` - database password
 - `DATABASE` - database name

### Example

```js
const MySQL = require('@aliceo2/web-ui').MySQL;
const mySql = new MySQL({'host.name', 'username', 'secret_password', 'database'});

/// Insert data
mySql.query('insert into layout (name, owner_id, owner_name, tabs) value (?,?,?,?)', [1, 2, 3, 4]);
  .then(result => console.log(result))
  .catch(err => console.error(err));

/// Select previously inserted data
mySql.query('select * from layout');
  .then(result => console.log(result)) // [{id: 1, name: 1, owner_id: 2, owner_name: 3, tabs: 4}, ...]
  .catch(err => console.error(err));
```
