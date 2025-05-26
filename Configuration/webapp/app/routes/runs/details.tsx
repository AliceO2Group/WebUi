import type {Route} from "./+types/details";
import type {Run} from "../../components/runs/run";
import {Await, data, Link} from "react-router";
import {Suspense} from "react";
import type {Log} from "~/components/logs/log";
import {RunLogs} from "~/components/runs/run-logs";
import {Spinner} from "~/ui/spinner";

const getRun = async (runNumber: number): Promise<Run> => {
    const response = await fetch(`http://localhost:8080/api/runs/${runNumber}`);
    if (!response.ok) {
        throw data(`Failed to fetch run with run number ${runNumber}`, {status: response.status});
    }
    return response.json();
}

const getLogs = async (runNumber: number): Promise<Log[]> => {
    const response = await fetch(`http://localhost:8080/api/runs/${runNumber}/logs`);
    if (!response.ok) {
        throw data(`Failed to fetch logs related to run with run number ${runNumber}`, {status: response.status});
    }
    return response.json();
}

export const clientLoader = async ({params}: Route.ClientLoaderArgs): Promise<{ run: Run, logs: Promise<Log[]> }> => {
    // Normally we would check that run number is a number...
    const runNumber = parseInt(params.runNumber, 10);

    const logs = getLogs(runNumber);
    const run = await getRun(runNumber);

    return {run, logs};
}

export default function Details({loaderData: {run, logs}}: Route.ComponentProps) {
    return <>
        <h1>Run {run.runNumber} details</h1>
        <p>The run has a {run.quality} quality.</p>
        <h2>Logs</h2>
        <Suspense fallback={<Spinner size={2} align={'left'} />}>
            <Await resolve={logs} errorElement={<div><em>Failed to load the logs</em></div>}>
                {(logs) => <RunLogs logs={logs} />}
            </Await>
        </Suspense>
        <Link to={'/runs'}>Back to overview</Link>
    </>;
}
