# rezepte-backend

This is a simple backend using TypeScript, Express.js, PostgreSQL and Docker. It provides CRUD functions for a to-be-implemented recipe management system.

## Usage

### Prerequisites

You need to have docker and docker-compose installed and a docker daemon running on your machine.

### Startup

To start the service, simply run `docker-compose up -d`.

### Shutdown

To shut down the service, simply run `docker-compose down`.

### Tests

To run all unit tests, execute `docker exec -it backend_container yarn test`.
