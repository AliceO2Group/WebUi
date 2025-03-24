# Project Testing

## 1. Install dependencies
Before running the tests, ensure that all project dependencies are installed.
Run the following command in the project root directory:
```bash
npm run --silent ci
```

## 2. Run all tests
To run all tests, use the following command:
``` bash
npm test
```
This command will run the tests using the Node.js Test Runner. 

## 3. Run specific Test Suites
You can run specific test suites by directly invoking the test files or using the node:test module.
Example: To run the tests for the LayoutController, use the following command:
```bash
node --test test/lib/controllers/LayoutController.test.js
```

## 4. Run Tests with Coverage
To run tests with coverage reporting, use the following command:
```bash
npm run coverage-local
```
This command will run the tests with coverage reporting using the node:test module.

