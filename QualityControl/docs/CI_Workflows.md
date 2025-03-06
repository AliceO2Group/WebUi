# Continuous Integration Workflows
QualityControl project makes use of two workflows.
## [qc.yml](./../.github/workflows/qc.yml)
* Checks that tests of the project are running successfully on two virtual machines:
  * `ubuntu`
  * `macOS`
* Make sure that the proposed changes are not reducing the current code-coverage percent
* Sends a code coverage report to [CodeCov](https://codecov.io/gh/AliceO2Group/WebUi)

## [release.yml](../.github/workflows/release.yml)
* Releases a new version of the project to the [NPM Registry](npmjs.com/) under the tag [@aliceo2/qc](https://www.npmjs.com/package/@aliceo2/qc)
* Builds a `tgz` file which contains an archive of the project. This can than be used for local repositories installations
