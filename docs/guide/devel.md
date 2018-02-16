# Development environment
This document describes development environment for the project. It also mentions good practices that should be followed by the developers.

## Tests
Each class or widget should be covered by unit tests. The following frameworks are used in the project:

* [QUnit](http://qunitjs.com) (front-end)
* [Mocha](https://mochajs.org) with [Chai](http://chaijs.com) assertion library (back-end)

The source code of unit tests is kept in `test/` directory. The filename should prefixed with either `qunit-` or `mocha-`. 

## Linting
The project uses [ESLint](http://eslint.org) to validate JavaScript syntax and coding style. The rules are defined in `.eslint` file and follow O<sup>2</sup> JavaScript Coding Guideline.

## Documentation
Documentation is handled with help of [JSDoc 3](http://usejsdoc.org) API generator.
The complete API of the project is available in [API.md](API.md) file.

## Build system
[npm scripts](https://docs.npmjs.com/misc/scripts) are used to automate tasks such as:
* front-end tests
* back-end tests
* test coverage
* documentation in Markdown format
* linting

Scripts are specified in `package.json` file.

## Continuous integration
[Travis CI](https://travis-ci.org/AliceO2Group/ControlGui) runs unit test each time the new code is pushed to the repository. The steps of build environment are specified in `.travis.yml` file.

## Dependencies status
The versions of [dependencies](https://david-dm.org/AliceO2Group/ControlGui) and [development dependencies](https://david-dm.org/AliceO2Group/ControlGui?type=dev) are monitored by David service.

## Test coverage
[Instambul](https://www.npmjs.com/package/istanbul) module together with [codecov](https://codecov.io) service are used to generate coverage reports of nodejs unit tests.
