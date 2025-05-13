import {Link} from "react-router";

export default function Home() {
  return <>
      <h1>Welcome to (dummy) bookkeeping!</h1>
      <Link to={'/runs'}>Runs overview</Link>
  </>;
}
