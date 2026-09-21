## Developer Guide

### Code Architecture

The O2 GUIs follow a layered architecture:

- **Controllers**: Handle incoming requests, validate input, and coordinate responses. Controllers should not contain business logic.
- **High-level Services**: Contain business logic and orchestrate calls to lower-level services or services dealing with external systems.
- **Low-level Services**: Encapsulate direct interactions with external systems (e.g., gRPC clients, databases, or file systems).
- **Utilities**: Shared helper functions and classes used across services and controllers.

**Typical flow:**  
`Controller → High-level Service → Low-level Service → External System`

### Coding Conventions

- **Controller Method Naming**:  
  Controller methods should end with `handler`.  
  _Example_: `getEnvironmentDetailsHandler`, `deployEnvironmentHandler`
- **Service Method Naming**:  
  Service methods that are fetching data from an external service should start with `retrieve`.  
  _Example_: `retrieveWorkflowMappings`, `retrieveHostsToIgnore`
- **Linting**: Code must pass ESLint checks - see `package.json` for command (e.g. `npm run eslint`)
- **Error Handling**:  
  - Services should throw errors; controllers are responsible for catching and responding.
  - Use custom error classes (e.g., `InvalidInputError`) for clarity.
- **Logging**: Use the provided O2 logger (`this._logger`) for warnings and errors.
- **Testing**:  
  - Write unit, integration, front-end, API tests (as per your use case) for all new features and bug fixes.
  - Use Mocha and Sinon for testing and mocking.
  - Place tests in the `test/` directory, mirroring the source structure.

### Adding a New Feature

1. **Create/Update Controller**:  
   - Add a new method or endpoint in the relevant controller, ending the method name with `handler`.
   - Validate input and call the appropriate service method.

2. **Implement Service Logic**:  
   - Add or update a method in a high-level service.
   - If the method fetches data from an external service, start its name with `retrieve`.
   - Encapsulate business logic and coordinate calls to low-level services.

3. **Update/Implement Low-level Service**:  
   - Add methods for direct communication with external systems if needed.

4. **Write/Update Tests**:  
   - Add unit tests for new or changed logic.
   - Ensure tests cover edge cases and error handling.

5. **Document**:  
   - Update this README or add comments/docstrings as needed.


### Best Practices

- **Keep controllers thin**: Only handle request/response logic.
- **Keep services focused**: Each service should have a clear responsibility.
- **Write meaningful commit messages**.
- **Use async/await** for asynchronous code.
- **Prefer immutability**: Avoid mutating input objects.
- **Handle all possible error cases** and provide clear error messages.
- **Review and update documentation** with every change.
