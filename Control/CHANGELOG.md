# Changelog

All notable changes to this project will be documented in this file.

## [1.43.1](https://github.com/AliceO2Group/WebUi/releases/tag/%40aliceo2%2Fcontrol%401.43.1)
* __Notable changes for users__:
  * Bug fixed in which variables per detector where not filtered properly from when creating a new workflow

## [1.43.0](https://github.com/AliceO2Group/WebUi/releases/tag/%40aliceo2%2Fcontrol%401.43.0)
* __Notable changes for users__:
  * Updates a bug in which combobox would limit the users input
  * Adds ODC status per environment in the table of Environments page

## [1.42.0](https://github.com/AliceO2Group/WebUi/releases/tag/%40aliceo2%2Fcontrol%401.42.0)
* __Notable changes for users__:
  * Users will now be able to transition an environment from state `DEPLOYED` to `CONFIGURED`:
  * Visual improvements as per users suggestions:
    * global runs are now displayed with a background color in ActiveEnvs
    * `TRG` column will now display `OFF`, `LTU` (if global trg is false), `CTP`( if global trg is true)
    * Save/Load configuration buttons are now grouped in General Panel
    * URIs configurations were moved to Adv Panel
  * Fixes a bug in which variables in `General Configuration` panel were not evaluated on `visibleif`

* __Notable changes for developers: NN__
## [1.41.0](https://github.com/AliceO2Group/WebUi/releases/tag/%40aliceo2%2Fcontrol%401.41.0)
* __Notable changes for users__:
  * Users are now able to define aliases to their CRU hardware. List of possible elements to name:
    * hosts
    * crus(serial:endpoint)
    * links

* __Notable changes for developers:__
  * Dependencies updated

## [1.40.0](https://github.com/AliceO2Group/WebUi/releases/tag/%40aliceo2%2Fcontrol%401.40.0)
* __Notable changes for users__:
  * When a QC workflow is selected the following widgets will not be displayed anymore:
    * detectors
    * hosts
    * readout URI
    * qc URI
  * Fixes a bug in which KV pairs from Adv Config Panel would not be removed if value was empty
* __Notable changes for developers: NN__