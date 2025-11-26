import { Box1_2 } from "~/components/box"

export const clientLoader = async () => {
    return {}
}

export default function Overview() {
    return (
        <div className="grid-1-2">
            <Box1_2 link={null}>
                <div className="p-4">
                    <h2 className="text-2xl font-bold mb-4">Certificates Overview</h2>
                    <p>This is where the certificates overview content will go.</p>
                </div>
            </Box1_2>
            <Box1_2 link="/certs/new">
                <div className="p-4">
                    <h2 className="text-2xl font-bold mb-4">Create New Certificate</h2>
                    <p>Click here to create a new certificate.</p>
                </div>
            </Box1_2>
        </div>
    )
}