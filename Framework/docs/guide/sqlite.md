

# MySQL client
Manages SQLite standard operations

- [MySQL client](#mysql-client)
  - [How to use](#how-to-use)
  - [Public methods](#public-methods)
    - [Init](#init)
    - [Query](#query)
    - [Close](#close)
  - [Example](#example)


## How to use
Import the module
```js
require('@aliceo2/web-ui').SQLiteConnector
```

Create an instance
```js
new SQLiteConnector(pathname);
```
Where:
 - `pathname` - path to where the SQLite file is stored


## Public methods

### Init
```js
init()
```
Initialize connection to specified location and returns a promise with the result of the action

### Query
```js
query (<query_string>, [values], [read])
```

Where:
- `query_string` -  It is a mandatory string containing the SQL query. Use `?` characters as placeholders for values you would like to have escaped
- `values` - Optional Array containing values that are escaped from the query.
- `read` - Optional Boolean specifying if the operation is read and should return values. Default `true`. For non-read operations, query will not return updated rows
```js
e.g

sqlConnector.query('SELECT * FROM Layouts WHERE id = ?', [1])
```

### Close
```js
close()
```
Close connection to the SQLite database and returns a promise with the result of the action


## Example

```js
const {SQLiteConnector} = require('@aliceo2/web-ui');
const sqliteConnector = new SQLiteConnector('/usr/locatino/of/db');

// Initialize connection
await sqliteConnector.init();

// Insert data
sqliteConnector.query('INSERT INTO layout (name, owner_id, owner_name, tabs) value (?,?,?,?)', [1, 2, 3, 4], true)
  .then(result => console.log(result))
  .catch(err => console.error(err));

// Select Data with await
try {
  const rows = await sqliteConnector.query('SELECT * FROM layout');
  console.log(result);
} catch(err) {
  console.error(err);
}

// Close Connection
sqliteConnector.close();
```
