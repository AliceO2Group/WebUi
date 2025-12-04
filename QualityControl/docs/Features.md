# Features
## Table of Contents
- [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [ROOT Object drawing options via Metadata](#root-object-drawing-options-via-metadata)
  - [Display a QC non-standard ROOT object in QCG](#display-a-qc-non-standard-root-object-in-qcg)
  - [Export a layout as JSON](#export-a-layout-as-json)
  - [Import a layout from JSON](#import-a-layout-from-json)
  - [AutoTransitioning Tabs within Layouts](#autotransitioning-tabs-within-layouts)
  - [Filters](#filters)
    - [Available Filters](#available-filters)
  - [Runs Mode](#runs-mode)
    - [How to Use Runs Mode](#how-to-use-runs-mode)
    - [Run Mode Header](#run-mode-header)
  - [Actions](#actions)
  - [Edit a Layout](#edit-a-layout)
    - [1. Via GUI](#1-via-gui)
    - [2. Via JSON](#2-via-json)

## ROOT Object drawing options via Metadata
`QCG` is using CCDB as storage service. When storing an object, the user can also store information on how an object should be plotted via the `metadata` field in CCDB. QualityControl documentation on how this can be achieved can be found [here](https://github.com/AliceO2Group/QualityControl/blob/master/doc/Miscellaneous.md#canvas-options)
* `drawOptions`: semi-colon separated drawing options; e.g. `lcolz;colz`
* `displayHints`: semi-colon separated hints; e.g. `AP;APB`

## Display a QC non-standard ROOT object in QCG

`QCG` is able to display non-standard ROOT objects with the help of QC. More information can be found [here](https://github.com/AliceO2Group/QualityControl/blob/master/doc/Miscellaneous.md#display-a-non-standard-root-object-in-qcg) 

## Export a layout as JSON
In order to facilitate the transition from one environment (e.g. TST) to another (e.g. PROD) while at the same time updating it, an export feature is provided.
1. Open the layout that you wish to export
2. Click on the top right second (from left to right) button which on hover shall display: `Export layout skeleton as JSON file`
3. Following that, QCG will automatically generate a JSON file and store it in your default download location.

## Import a layout from JSON
Once a layout is exported and modified as needed or created from scratch, one can import it into QCG as such:
1. On the left sidebar, click on the small button (icon represented as cloud with arrow up) which is in line with `MY LAYOUTS` label.
2. A pop-up will open which will allow you to paste your JSON structure.
3. The pop-up will validate that the pasted value is a valid JSON.
4. Click on `Import` button.
   1. If successful, a new page will be opened with your imported layout in edit mode
   2. If there is an issue, a red line with an error message will be displayed above the Import button
5. Click `Save` Layout from the top right corner button.

## AutoTransitioning Tabs within Layouts
To easily follow the progress of a RUN, layouts can automatically transition through the displayed tabs every few seconds. To configure:
1. Open desired layout
2. Click on the `pencil icon` button to start editing the layout
3. On the left sidebar, configure the field `Tab Auto-Change(sec): 0 (OFF), 10-600 (ON)` with the desired numerical value
4. Save 

## Filters
Filters allow users to refine the displayed objects within a layout, ensuring only relevant data is shown. If an object does not match the selected filters, a "Not Found" status is displayed for that object.

### Available Filters
- **Run Number**: Filter objects by their associated run number.
- **Run Type**: Filter objects by the type of run.
- **Period Name**: Filter objects by the period name.
- **Pass Name**: Filter objects by the pass name.

Only objects in the layout that match the selected filters will be displayed.

## Runs Mode
Runs Mode is a specialized viewing mode that allows users to focus on data from a specific run. When activated, it simplifies the interface by removing all other filters and applying only the run number filter. If the run is still ongoing, it will refresh the latest paths generated periodically.

### How to Use Runs Mode
1. Navigate to the object tree or layout view.
2. Select a specific run number to enter Runs Mode.
3. The interface will automatically switch to show only data from the selected run.
4. Use the "Exit" button in the run mode header to return to normal filtering mode.

### Run Mode Header
When in Runs Mode, a header appears at the top of the interface showing:
- The current run number (e.g., "Run #12345")
- The run status (ONGOING or ENDED)
- An information button that provides status explanations
- An exit button to leave Runs Mode


## Actions
Users can perform the following actions within the layout editor:

- **Duplicate Layout**: Quickly create a copy of the layout for modifications without altering the original.
- **Share Layout**: Download the layout skeleton as a JSON file for sharing or backup purposes.

## Edit a Layout

For advanced users, layouts can be edited directly by modifying the JSON code. This method provides greater flexibility and control over the layout configuration.
### 1. Via GUI
The GUI provides an intuitive and user-friendly way for layout creators to edit and customize their layouts without needing to write code.

- **Change Layout Name**: Modify the name of the layout.
- **Modify Tabs**: Rename tabs, change their order, and even delete or add tabs as needed.
- **Adjust Number of Columns per Tab**: Customize the number of columns within each tab.
- **Edit Layout Description**: Update the description of the layout.
- **Auto-Switch Time for Tabs**: Set the auto-switch time between tabs (default is 0).
- **Drag & Move Objects**: Rearrange objects within the layout.

### 2. Via JSON
1. Open the layout you wish to edit.
2. Click on the `pencil icon` button to start editing the layout.
3. Click the `Edit JSON` button.
4. A popup will appear, displaying the layout’s current configuration in plain JSON text format.
   - The system validates the JSON structure to ensure it is correctly formatted.
   - Certain fields, such as the `ID`, cannot be set manually.
5. Make the necessary changes and click `Save`.
