# Development

## Getting started
### Requirements
NodeJS - `v22` (min)
Docker

### Configuration
A `.env` configuration file is necessary for development and must be placed in the root folder of the project. Example:
``` ini
MYSQL_DATABASE=qcg_dev_db
MYSQL_USER=qcg_dev_user
MYSQL_PASSWORD=123456
MYSQL_ROOT_PASSWORD=123456
```

### Run QCG

Execute this command to launch the application
```bash
docker-compose-up
``` 
Once it is running, go to [localhost:8080](localhost:8080).
