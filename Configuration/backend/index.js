import {HttpServer} from "@aliceo2/web-ui";

const http = new HttpServer({port: 8080, allow: '*'});

const fakeRuns = new Map([
    [1, {runNumber: 1, quality: 'good'}],
    [2, {runNumber: 2, quality: 'bad'}],
    [3, {runNumber: 3, quality: 'good'}],
]);

const fakeLogs = new Map([
    [1, []],
    [2, [
        {id: 1, title: 'The first log ever', content: 'Wow, that is amazing'},
        {id: 3, title: 'No second log?', content: 'Looks like second log is lost somewhere'}
    ]]
]);

http.get("/healthcheck", (req, res) => {
    res.status(200).send()
}, {public: true});

http.get("/runs", (req, res) => {
    // Fake long page load
    setTimeout(
        () => res.status(200).json([...fakeRuns.values()]),
        1000
    );
}, {public: true});

http.get("/runs/:runNumber", (req, res) => {
    const runNumber = parseInt(req.params.runNumber, 10);
    const run = fakeRuns.get(runNumber) ?? null;

    if (!run) {
        res.status(404).json({error: `No run found with run number ${runNumber}`});
        return;
    }

    res.status(200).json(run);
}, {public: true});

http.get("/runs/:runNumber/logs", (req, res) => {
    const runNumber = parseInt(req.params.runNumber, 10);

    // Artificially add an error
    if (runNumber === 3) {
        res.status(500).json({error: `An error occurred when trying to load logs for run ${runNumber}`});
        return;
    }

    const logs = fakeLogs.get(runNumber) ?? [];

    if (!logs) {
        res.status(404).json({error: `No logs found found for run number ${runNumber}`});
        return;
    }

    setTimeout(
        () => res.status(200).json(logs),
        1000,
    );
}, {public: true});
