# Global Runs Page

The AliECS GUI has two pages dedicated specifically to the creation of an environment via AliECS. One of them is the "Global Runs" page which allows the admins to define a set of pre-defined configurations for the shifters to use. These are labeled as per their usecase and loaded from the KV Store used by the system. Moreover, the GUI will fetch the latest version of the selected configuration right before sending the request to ECS, to ensure that the latest version is used in case the page had staled information. 

### Configuration

The page is dynamically built based on configuration identified in the KV store.
Key:  `o2/runtime/COG/workflow-mappings`

The configuration is stored under the above key and expects the following format:

```json
[
  {
    "label": "<label_name>", // label that is to be use
    "configuration": "<configuration_name>" // configuration key as defined in the KV store
  }
]
```
