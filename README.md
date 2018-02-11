# Node Source dependencies

Ease the development of a multi-repository project by installing sub packages as source dependencies.

## Installation

    $ yarn add -D src-dependencies

After the installation you can use additional yarn commands to install your source packages

## Commands:

### Add a source dependency to the project:

    $ yarn src-add [package-name]

This command looks up the packages repository url from the npm registry and it then be clones the package into the src_modules folder. A symlink to the source folder will be created in node_modules. It also adds an entry to the srcDependencies section the project's package.json file.

### Install all source dependencies specified inside of the package.json file

    $  yarn src-add

### Execute a command inside of a source dependency package folder:

    $ yarn src-run [package-name] [command] [arg...]

#### Example:

Watch for source code changes inside of your sub package and incrementally recompile the code.

    $ yarn src-run my-app-component yarn watch

### Execute a command inside of all source dependency folders:

    $ yarn src-run --all [command] [arg...]

#### Example:

    $ yarn src-run --all git pull
    $ yarn src-run --all yarn build

### Execute a command inside of the main project and all source dependency folders:

    $ yarn src-run --sync [command] [arg...]

#### Example:

    $ yarn src-run --sync git checkout -b feature/new_feature

This will create and checkout a new branch called "feature/new_feature" in the main project's repository as well as in each of the source dependencies repository folders
