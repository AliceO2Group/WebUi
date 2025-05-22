# Project Testing

## 1. Run all tests
To run all tests, use the following command:
``` bash
npm run docker-test
```
This command will run the tests in docker using the Node.js Test Runner. It will not include the logs from back-end integration tests.

## 2. Run Tests in debug mode
To run tests with all the logs from the frontend and back-end, use the following command:
```bash
npm run test-debug
```
This command will run the tests and include all backend and frontend logs for debugging purposes.

## 3. Run Tests with Coverage
To run tests with coverage reporting, use the following command:
```bash
npm run docker-coverage-local
```
This command will run the tests with coverage reporting using the node:test module.
