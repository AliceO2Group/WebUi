# MySQL client
Manages pool of MySQL connections.

#### Instance
Import the module
```js
require('@aliceo2/web-ui').MySQL
```

Create an instance
```js
MySQL({host: HOST, user: USER, database: DATABASE [, password: PASSWORD, port: PORT]});
```

Where:
 - `HOST` - database hostname
 - `USER` - database username
 - `PASSWORD` - database password
 - `DATABASE` - database name
 - `PORT` - database port number


#### Public methods

```js
query
```

#### Escaping values
Use `?` characters as placeholders for values you would like to have escaped and pass array of values as second parameter to `query` method:

```js
mySql.query('SELECT * FROM Layouts WHERE id = ?', [1])
```

### Getting feedback from INSERT, UPDATE or DELETE
The following values are available as result of INSERT, UPDATE or DELETE
- `affectedRows` - affected rows from an INSERT or DELETE
- `changedRows` - changed rows from an INSERT
- `insertId` - id of INSERTed row

More details available in here: https://github.com/mysqljs/mysql#table-of-contents

#### Example

```js
const {MySQL} = require('@aliceo2/web-ui');
const mySql = new MySQL({host: 'localhost', user: 'root', database: 'test'});

// Insert data
mySql.query('INSERT INTO layout (name, owner_id, owner_name, tabs) value (?,?,?,?)', [1, 2, 3, 4])
  .then(result => console.log(result))
  .catch(err => console.error(err));
```
