# rezepte-backend

This is a simple backend using TypeScript, Express.js, PostgreSQL and Docker. It provides CRUD functions for a to-be-implemented recipe management system.

## Usage

### Prerequisites

You need to have docker and docker-compose installed and a docker daemon running on your machine.

### Startup

To start the service, simply run `docker-compose up -d`.

Upon first startup, the database will be created according to the schema defined in the file `src/db/recipes.sql`. The database files will then be stored in a docker volume, persistent to restarts.

### Shutdown

To shut down the service, simply run `docker-compose down`.

### Tests

Every possible case that can occur in routing or db handling is tested with [Jest](https://jestjs.io/).

To run all unit tests, execute `docker exec -it backend_container yarn test`.
