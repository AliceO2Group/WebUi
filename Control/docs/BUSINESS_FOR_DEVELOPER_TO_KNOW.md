# Business logic for developers to know

ALICE's Experiment Control System ([ECS](https://github.com/AliceO2Group/Control)) uses entities named environments to enable users to take data in ALICE. These environments are a set of software and hardware configurations used for preparation and during data-taking operations.

## Environment States and Transitions
Environments can transition ([link](https://github.com/AliceO2Group/Control/blob/master/core/protos/o2control.proto#L228)) between multiple states. These states can be:
- state machines - [link](https://github.com/AliceO2Group/Control/blob/master/core/environment/environment.go#L153-L160)
- virtual states (states that are not real but used for software logic such as DESTROY or PENDING)

Thus, for the GUI to provide a good user experience, the ECS GUI introduces a few logic items that are to be known when developing for ECS GUI:

## Deployment and ECS GUI private attributes
A deployment is a set of operations that prepares hardware and software for data taking operations. A deployment is a definition in ECS GUI that covers an environment first transition from:
- `PENDING` (virtual state) -> `STANDBY` -> `DEPLOY` -> `CONFIGURED`

For this sequence of actions, ECS GUI assigns a private attribute `isDeploying` and `deploymentError` to the environment so that it can display to the User all the information needed.
- `isDeploying` set to:
  - `true` - only by:
    - the response of the `NewEnvironmentAsync`
    - the first event from ECS via Kafka of state `PENDING`
  - `false` - only if:
    - an event with state `CONFIGURED` and message `'transition completed successfully'` is received
    - an event with an error message is received during when `isDeploying` is `true` already (TBD)
- `deploymentError` is updated every time there is an event with an error (TBD)

These attributes allow the GUI to display all necessary deployment information to the user.

If a deployment fails, the ECS will remove it from the active environments list. Thus, the GUI uses `deploymentError` to make sure the environment is kept in-memory until the user acknowledges the error. 
