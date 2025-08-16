import type { Run } from "../../components/runs/run";
import type { Route } from "./+types/overview";
import {Link} from "react-router";

export const clientLoader = async (): Promise<Run[]> => {
    const response = await fetch('http://localhost:8080/api/runs');
    if (!response.ok) {
        throw new Error('An error occurred!');
    }
    return response.json();
}

export default function Overview({loaderData: runs}: Route.ComponentProps) {
    return <>
        <h1>Runs</h1>
        <table className={"table"}>
            <thead>
                <tr>
                    <th>Run number</th>
                    <th>Quality</th>
                </tr>
            </thead>
            <tbody>
            {runs.map((run) => <tr key={run.runNumber}>
                <td><Link to={`/runs/${run.runNumber}`}>{run.runNumber}</Link></td>
                <td className={run.quality === 'bad' ? 'danger' : ''}>{run.quality}</td>
            </tr>)}
            </tbody>
        </table>
    </>
}
