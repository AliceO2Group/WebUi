# Ignore FLPs by RunType

AliECS GUI can be configured to ignore the selection of certain FLPs when building and sending a request to AliECS to deploy an environment. The specified FLPs will be ignore even if the user selects it when creating the environment via the GUI. Such conditions are sometimes needed for certain run types. Thus, before a deployment is requested, the GUI will check in the KV store if such conditions are defined.

Key: `o2/runtime/COG/runType-to-host-mapping`

The configuration is stored under the above key and expects the following format:

```json
{
  "<run_type>": [
    "host1",
    "host2"
  ]
}
```
