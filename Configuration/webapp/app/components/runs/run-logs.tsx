import type {Log} from "~/components/logs/log";

interface RunLogsProps {
    logs: Log[];
}

export const RunLogs = ({logs}: RunLogsProps) => {
    if (logs.length === 0) {
        return <p><em>No logs linked to this run</em></p>
    }
    return <table className={'table'}>
        <thead>
        <tr>
            <th>Title</th>
            <th>Content</th>
        </tr>
        </thead>
        <tbody>
        {logs.map(({id, title, content}) => <tr key={id}>
            <td>{title}</td>
            <td>{content}</td>
        </tr>)}
        </tbody>
    </table>
}
