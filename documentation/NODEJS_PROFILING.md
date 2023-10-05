# NodeJS Profiling

NodeJS provides a built-in profiler which allows developer to analyse and optimise their code. Official documentation and in-depth details can be found [here](https://nodejs.org/en/docs/guides/simple-profiling).

## Summary of how to:
1. Start WebUI server that is to be investigated with: `node --prof index.js`
2. Execute for a few times at an interval the user scenarios that are suspected to be causing a big stress on the server. During this time, NodeJS will automatically create and update a file with the analysis details while the server is running.
3. Once done, stop the server.
4. Use the NodeJS generated log file prefixed with `isolate-` to get a report of the activities by running: `node --prof-process isolate-<rest_of_log_file_name>.log > processed.txt`
5. Open the `processed.txt` file in your preferred editor, analyse the `[Summary]` section and identify `Components/Sub-Sections` that have a high number of `ticks` or increased percentage from the total.
6. Proceed to analyse sub-sections that appear to be taking lots of resources.