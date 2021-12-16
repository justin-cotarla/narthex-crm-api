# Narthex CRM API
A CRM for Orthodox Churches

## Environment
Narthex CRM expects an environment file (`.env`)
```
SERVER_PORT=[number]
MYSQL_PASSWORD=[string]
MYSQL_USER=[string]
DB_CONNECTION_LIMIT=[number]
DB_HOST=[string]
DB_NAME=[string]
JWT_SECRET=[string]
```

## Development
To setup a local development for Narthex API, first install Node dependencies:
```bash
$ npm install
```

Generate the typings for the GraphQL schema:
```bash
$ npm run generate
```

Finally, start the project in development mode:
```bash
$ npm run dev
```

The app will be running from `127.0.0.1:5050`

### Dev Containers
This project supports [VSCode dev containers](https://code.visualstudio.com/docs/remote/containers). To enable it, install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) plugin for VSCode, then run the following from the command palette:
```
> Remote-Containers: Reopen in Container
```