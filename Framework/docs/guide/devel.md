# Development environment
This document describes development environment for the `WebUi` Framework and projects depending on it. It also provides good practices which developers are encouraged to follow.

## Tests
Source code should be covered by unit tests and/or integration tests. The following test utilities are used in the project:

* [Puppeteer](https://github.com/GoogleChrome/puppeteer) [API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) (front-end integration)
* [Mocha](https://mochajs.org) (front-end and back-end unit tests)
* [Assert](https://nodejs.org/api/assert.html) native NodeJS assertion library for Mocha

The source code of unit tests is kept in `Backend/test/` and `Frontend/test/` directories. The filename should prefixed with `mocha-`.

## Linting
The project uses [ESLint](http://eslint.org) to validate JavaScript syntax and coding style. The rules are defined in `.eslint` file and follow O<sup>2</sup> JavaScript Coding Guideline.

Exceptions can be added to lines and files:
- `/* eslint max-len: 0 */` removes maximum length for current file
- `/* eslint-disable */` removes eslint from current file
- `// eslint-disable-next-line` removes eslint from next line
- `// eslint-disable-next-line max-len` removes eslint maximum length from next line

## Code monitor
[Nodemon](http://nodemon.io/) provides convenient development cycle server by restarting server after source code modification modification. Browser page can be refreshed with CTRL+R or CMD+R.

## NPM scripts
[npm scripts](https://docs.npmjs.com/misc/scripts) are used to automate tasks:
* `npm start` starts the server in production
* `npm run dev` starts server in watch mode (nodemon enable)
* `npm run eslint` runs linter
* `npm run mocha` starts front-end and back-end unit tests
* `npm run test` runs both: `npm run mocha` and `npm run eslint`

## Continuous integration
#### [framework.yml](./../../../.github/workflows/framework.yml)
* Checks that tests of the project are running successfully on two virtual machines:
  * `ubuntu`
  * `macOS`
* Make sure that the proposed changes are not reducing the current code-coverage percent
* Sends a code coverage report to [CodeCov](https://codecov.io/gh/AliceO2Group/WebUi)
* Runs a compatibility set of tests on each project (Control, QualityControl, InfoLogger) to ensure changes to the framework are not breaking existing projects. 

#### [release.yml](../.github/workflows/release.yml)
* Releases a new version of the project to the [NPM Registry](npmjs.com/) under the tag [@aliceo2/web-ui](https://www.npmjs.com/package/@aliceo2/web-ui)


## Dependencies status
The status of the dependencies can be shown by running `ncu` command of [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) package.

## Test coverage
[Instanbul](https://istanbul.js.org/) module together with [codecov](https://codecov.io) service are used to generate coverage reports of nodejs unit tests.

## Source management
[Github](https://github.com/AliceO2Group/WebUi) is used for managing sources and [npm](https://www.npmjs.com/package/@aliceo2/web-ui) for releases.

## `npm run dev`

- On Framework this command will start a little web server to have the ability to work on static files like CSS or charts.
- On projects using Framework it will start web server of the application like in production but with a code monitor enabled (see above).

## Release process
Set "Fix version" of each JIRA issue that is being released, as we host multiple packages in the repo use npm naming conventions: `<org>/<package>@<version>` (this may have been already done when creating an issue or at later stage)

If all the issues for the given release are in the "Ready for release" status start the process:
1. Bump npm (`package.json`) version, either manually or using `npm version` script, create "release" PR against `dev`, merge
2. Create a PR to merge `dev` with `master` (in order to run checks and upload coverage report), merge the PR (it can be simply done by doing `git pull origin dev`, `git push origin master`)
3. Create and push GH tag: as we host multiple packages in the repo use `npm` naming conventions: `<org>/<package>@<version>`
4. `npm publish`
5. Mark version as released in JIRA
6. Create GH release, generate "Release Notes" from JIRA and add them to release description
7. Update status of JIRA issues (You can use Bulk Change feature to edit multiple issues at once)
8. Bump version in [alidist](https://github.com/alisw/alidist) or/and in [system-configuration](https://gitlab.cern.ch/AliceO2Group/system-configuration)
