import {type RouteConfig, index, route, prefix} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    ...prefix('runs', [
        index("routes/runs/overview.tsx"),
        route(":runNumber", "routes/runs/details.tsx"),
    ]),
] satisfies RouteConfig;
