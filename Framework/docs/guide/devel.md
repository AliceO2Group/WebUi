# Development environment
This document describes development environment for the `WebUi` Framework and projects depending on it. It also provides good practices which developers are encouraged to folllow.

## Tests
Source code should be covered by unit tests and/or integration tests. The following test utilities are used in the project:

* [Puppeteer](https://github.com/GoogleChrome/puppeteer) [API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) (front-end integration)
* [Mocha](https://mochajs.org) (front-end and back-end unit tests)
* [Assert](https://nodejs.org/api/assert.html) native NodeJS assertion library for Mocha

The source code of unit tests is kept in `Backend/test/` and `Frontend/test/` directories. The filename should prefixed with `mocha-`.

## Linting
The project uses [ESLint](http://eslint.org) to validate JavaScript syntax and coding style. The rules are defined in `.eslint` file and follow O<sup>2</sup> JavaScript Coding Guideline.

## Documentation
Documentation is handled with help of [JSDoc 3](http://usejsdoc.org) API generator.

## Code monitor
[Nodemon](http://nodemon.io/) provides convenient development cycle server by restarting server after source code modification modification. Browser page can be refreshed with CTRL+R or CMD+R.

## NPM scripts
[npm scripts](https://docs.npmjs.com/misc/scripts) are used to automate tasks:
* `npm start` starts the server in production
* `npm run dev` starts server in watch mode (nodemon enable)
* `npm run eslint` runs linter
* `npm run mocha` starts front-end and back-end unit tests
* `npm run test` runs both: `npm run mocha` and `npm run eslint`
* `npm run doc` generates source code documentation (JSDoc)

## Continuous integration
[Travis CI](https://travis-ci.org/AliceO2Group/WebUi) runs unit test each time the new code is pushed to the repository. The steps of build environment are specified in `.travis.yml` file.

## Dependencies status
The versions of [dependencies](https://david-dm.org/AliceO2Group/WebUi) and [development dependencies](https://david-dm.org/AliceO2Group/WebUi?type=dev) are monitored by David service.

## Test coverage
[Instambul](https://www.npmjs.com/package/istanbul) module together with [codecov](https://codecov.io) service are used to generate coverage reports of nodejs unit tests.

## Source management
[Github](https://github.com/AliceO2Group/WebUi) is used for managing sources and [npm](https://www.npmjs.com/settings/aliceo2/packages) for releases.
