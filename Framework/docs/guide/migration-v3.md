# Migration guide - v2 to v3 (Express v5)

`@aliceo2/web-ui` v3 upgrades the HTTP server from [Express v4 to Express v5](https://expressjs.com/en/guide/migrating-5.html).
The public API of `HttpServer` (`get`, `post`, `put`, `patch`, `delete`, `addStaticPath`, ...) stays the same, but the `req` and `res` objects passed to your handlers, as well as the accepted route path syntax, follow Express v5 rules.

This guide lists the changes that may affect applications built on top of the framework.

## Why
- **Async errors are handled**: if an `async` handler or middleware throws or returns a rejected promise, the error is forwarded to the framework's error handler (`500` response) instead of leaving the request hanging.
- **Safer route matching**: Express v5 uses `path-to-regexp` v8, which removes the regular expression features that allowed ReDoS attacks ([CVE-2024-45296](https://github.com/advisories/GHSA-9wv6-86v2-598j)).
- **Safer defaults**: the `simple` query parser is used by default, `res.status()` rejects invalid codes and static files ignore dotfiles.
- **Maintained**: Express v5 is the actively supported release line, v4 only receives maintenance and security fixes.

## Requirements
- Node.js `>= 22.x` (unchanged)

## Upgrade steps

### 1. Update the dependency
```json
"@aliceo2/web-ui": "3.0.0"
```

### 2. Update route paths
Express v5 no longer accepts optional parameters with `?`, inline regular expressions or unnamed wildcards.
Invalid paths **throw when the route is registered**, so the application fails at startup with an error such as:
```
PathError [TypeError]: Unexpected ? at index 24: /environment/:id/:source?
```

| v2 (Express v4) | v3 (Express v5) | Notes |
|---|---|---|
| `/environment/:id/:source?` | `/environment/:id{/:source}` | optional segments are wrapped in braces |
| `/configurations/:key(*)` | `/configurations/*key` | `req.params.key` is now an **array** of path segments, use `req.params.key.join('/')` |
| `/files/*` | `/files/*splat` | wildcards must be named |
| `/:id(\\d+)` | `/:id` | inline regular expressions are not supported, validate the parameter in the handler |

The characters `(`, `)`, `[`, `]`, `?`, `+` and `!` are reserved in paths. Escape them with `\\` if they need to be matched literally.

### 3. Do not assign `req.query`
`req.query` is now a getter. Assigning it throws a `TypeError` in strict mode (ES modules, `'use strict'`) and is silently ignored otherwise:
```
TypeError: Cannot set property query of #<IncomingMessage> which has only a getter
```
Store validated or transformed values elsewhere, for example in `res.locals`:
```js
// v2
req.query = await QueryDto.validateAsync(req.query);
// v3
res.locals.query = await QueryDto.validateAsync(req.query);
```

### 4. Check nested query parameters
Express v5 parses query strings with the `simple` parser by default. Repeated keys still become arrays, but bracket keys are no longer turned into objects:

| Query string | `simple` (v3 default) | `extended` (v2 behaviour) |
|---|---|---|
| `?a=1&a=2` | `{ a: ['1', '2'] }` | `{ a: ['1', '2'] }` |
| `?filter[name]=x` | `{ 'filter[name]': 'x' }` | `{ filter: { name: 'x' } }` |
| `?fields[]=a&fields[]=b` | `{ 'fields[]': ['a', 'b'] }` | `{ fields: ['a', 'b'] }` |

If your API relies on nested parameters, either move to flat parameters (recommended) or opt into the previous behaviour with the new `queryParser` option of the [HTTP server](http-server.md):
```js
const http = new HttpServer({ port: 8080, queryParser: 'extended' }, jwtConfig);
```

### 5. Handle a missing request body
`req.body` is `undefined` (previously `{}`) when the request has no body or its content type is not JSON. Code that reads properties of `req.body` or validates it as an object should use a fallback:
```js
const { name } = req.body ?? {};
await BodyDto.validateAsync(req.body ?? {});
```

### 6. Replace removed request and response methods
| Removed (v2) | Replacement (v3) |
|---|---|
| `req.param('name')` | `req.params.name`, `req.query.name` or `req.body.name` |
| `res.json(obj, status)` | `res.status(status).json(obj)` |
| `res.send(status)` | `res.sendStatus(status)` |
| `res.sendfile(path)` | `res.sendFile(path)` |
| `res.redirect('back')` | `res.redirect(req.get('Referrer') \|\| '/')` |
| `req.acceptsCharset`, `req.acceptsEncoding`, `req.acceptsLanguage` | `req.acceptsCharsets`, `req.acceptsEncodings`, `req.acceptsLanguages` |

### 7. Other behaviour changes
- `res.status(code)` only accepts integers between `100` and `999`, other values throw.
- Static paths added with `addStaticPath` ignore dotfiles (e.g. `.env`, `.hidden/`) by default.
- `req.host` now includes the port number.
- Errors thrown or rejected in `async` handlers are forwarded to the framework's error handler, which replies with `500`. Keep explicit `try/catch` blocks only where a different status code is expected.

## Checklist
The commands below help find code that needs to be reviewed, run them from the application folder:
```bash
# Optional parameters, inline regular expressions and wildcards in routes
grep -rnE ":[A-Za-z_]+\?|:[A-Za-z_]+\(|\(\*\)|/\*['\"\`]" lib/
# Assignments to req.query
grep -rnE "req\.query\s*=[^=]" lib/
# Nested query parameters built by the frontend
grep -rnE "[A-Za-z]\[[^]]*\]=" public/
# Reads of req.body that assume an object
grep -rn "req\.body" lib/
# Removed methods
grep -rnE "req\.param\(|res\.sendfile|'back'|acceptsCharset\b|acceptsEncoding\b|acceptsLanguage\b" lib/
```
