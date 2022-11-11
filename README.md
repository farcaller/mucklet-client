<h2 align="center"><b>Mucklet Web Client</b></h2>

Web client for Mucklet.com, a textual world of roleplay.

# Quick start

Install [Git](https://git-scm.com/downloads) and
[NodeJS](https://nodejs.org/en/download/), and run the following commands:

```text
git clone https://bitbucket.org/anisus/mucklet-client
cd mucklet-client
npm install
npm run client:realm:test
```

Open a browser and go to the URL below, but replace `<USER>` and `<PASS>` with the
username and password of your Mucklet developer account:
```text
http://localhost:6450/?login.player=<USER>&login.pass=<PASS>
```

# About

The Mucklet Client is a Single Page Application, written in pure Javascript,
compiled into a bundle using Webpack.

## Understanding the application

The application uses multiple experimental technologies, unfamiliar to most
developers. So, when working with this client, make sure to read the overviews:

* [Understanding modules](./docs/understanding-modules.md)
* [Understanding events](./docs/understanding-events.md)
* [Understanding the API](./docs/understanding-api.md)
* [Understanding components](./docs/understanding-components.md)
* [Understanding the folder structure](./docs/understanding-folders.md)

# Contributing

To learn how to contribute to the project, read the [How to contribute](./docs/CONTRIBUTE.md) guide.

## Style guide

All contributed code should follow the [style guide](./docs/style-guide.md).
