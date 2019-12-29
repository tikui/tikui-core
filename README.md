# Tikui Core

Tikui core is the heart of Tikui. Combined to a documentation and some configurations you will be able to create a Tikui project.

## Prerequisites

* Nodejs

## How to use

### Classic way

You can use it by cloning or downloading [Tikui](https://www.github.com/tikui/tikui).

### As a dependency

The other way to use it is on a node project as a dependency, here is an example of use:

```bash
mkdir example-project
cd example-project
npm init
# Follow instructions
npm i @tikui/core tikuidoc-tikui
echo '{"documentation": "tikui"}' > tikuiconfig.json
mkdir src
npx tikui-core serve
```

Tikui is started, you may see how sources are organized to understand how to organize your components by looking at the [Tikui](https://www.github.com/tikui/tikui) sources structure.

## Development

### Install

    npm i

### Contribute

Tikui core contains integration and unit tests to specify features, you have to launch tests using npm:

    npm test

Then you can add other tests to make a new feature and when all your feature tests are green you can create a Pull Request.
